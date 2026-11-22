import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import type { Comment, FeedPage, Gallery, Link, Post, SearchResult, Thread, Topic, User } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabUser, uniqueTestIp } from "../utils/test-server"

const admin = await grabUser("admin")
const password = "ContentFilterTest-password"

interface FilterTestAccount {
    accessToken: string
    user: User
}

async function createAccount(): Promise<FilterTestAccount> {
    const username = `Filter${randomUUID().replaceAll("-", "").slice(0, 12)}`
    const registerResponse = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
        body: JSON.stringify({
            username,
            email: `${username.toLowerCase()}@example.invalid`,
            password,
        }),
    })
    expectStatus(registerResponse, 200, "filter account registration stage")
    const accessToken = await registerResponse.text()
    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(profileResponse, 200, "filter account authentication stage")
    return { accessToken, user: await profileResponse.json() as User }
}

function accountFetch(account: FilterTestAccount, path: string, body?: unknown) {
    return fetch(path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
            Authorization: account.accessToken,
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
}

async function getFilters(account: FilterTestAccount) {
    const response = await accountFetch(account, "/api/profile/filters")
    expectStatus(response, 200)
    return await response.json() as {
        muted: Array<{ id: string, name: string }>
        blocked: Array<{ id: string, name: string }>
    }
}

async function cleanupTestData(accounts: FilterTestAccount[], postId?: string, topicId?: string, threadId?: string) {
    const userIds = accounts.map(account => account.user.id)
    const cleanupUsers = userIds.length > 0
        ? `
            DELETE session WHERE account IN (SELECT VALUE id FROM account WHERE user IN [${userIds.join(", ")}]);
            DELETE account WHERE user IN [${userIds.join(", ")}];
            DELETE userSettings WHERE user IN [${userIds.join(", ")}];
            DELETE user WHERE id IN [${userIds.join(", ")}];
        `
        : ""

    await admin.query(`
        ${postId ? `DELETE notification WHERE context = post:${postId}; DELETE post:${postId};` : ""}
        ${threadId ? `DELETE notification WHERE context = thread:${threadId}; DELETE thread:${threadId};` : ""}
        ${cleanupUsers}
        ${topicId ? `DELETE topic:${topicId};` : ""}
    `)
}

async function expectDedicatedFeeds(
    account: FilterTestAccount | undefined,
    feeds: Array<{ path: string, id: string }>,
    visible: boolean,
    stage: string,
) {
    for (const feed of feeds) {
        const response = account ? await accountFetch(account, feed.path) : await fetch(feed.path)
        expectStatus(response, 200, `${stage} ${feed.path}`)
        const page = await response.json() as FeedPage<{ id: string }>
        expect(page.items.some(item => item.id === feed.id), `${stage} ${feed.path}`).toBe(visible)
    }
}

async function clearFilters(accounts: FilterTestAccount[], targets: string[]) {
    for (const account of accounts) {
        for (const action of ["unmute", "unblock"] as const) {
            for (const target of targets) {
                const response = await accountFetch(account, `/api/profile/filters/${action}`, { target })
                expectStatus(response, 200, `clear ${action} ${target}`)
            }
        }
    }
}

async function expectBlockedInteraction(response: Response, recordIds: string[], stage: string) {
    if (response.status === 200) {
        recordIds.push((await response.json() as { id: string }).id)
    }
    expectStatus(response, 403, stage)
}

it("mutes and blocks users independently, removes follows, and prevents interactions", async () => {
    const accounts: FilterTestAccount[] = []
    const actionTopicId = `blockedAction${randomUUID().replaceAll("-", "").slice(0, 12)}`
    let actionPostId: string | undefined
    try {
        const actor = await createAccount()
        accounts.push(actor)
        const target = await createAccount()
        accounts.push(target)
        const targetId = extractId(target.user.id)!
        const actorId = extractId(actor.user.id)!

        expectStatus(await fetch("/api/profile/filters"), 401)
        expectStatus(await accountFetch(actor, "/api/profile/filters/mute", { target: "post:invalid" }), 404)
        expectStatus(await accountFetch(actor, "/api/profile/filters/mute", {}), 400)
        expectStatus(await accountFetch(actor, "/api/profile/filters/block", { target: actor.user.id }), 400)
        expectStatus(await accountFetch(actor, "/api/profile/filters/block", { target: "user:deleted" }), 400)
        expectStatus(await accountFetch(actor, "/api/profile/filters/block", { target: `user:missing${randomUUID().replaceAll("-", "")}` }), 404)

        const topicPostResponse = await accountFetch(target, "/api/post/add", {
            title: `Blocked action ${randomUUID().slice(0, 8)}`,
            content: "Topic block award target.",
            topics: [`topic:${actionTopicId}`],
            images: [],
        })
        expectStatus(topicPostResponse, 200, "blocked-topic award target stage")
        actionPostId = extractId((await topicPostResponse.json() as Post).id)
        expectStatus(await accountFetch(actor, "/api/profile/filters/block", { target: `topic:${actionTopicId}` }), 200)
        expectStatus(await accountFetch(actor, `/api/post/${actionPostId}/award`, {}), 403, "blocked-topic award stage")

        expectStatus(await accountFetch(actor, `/api/user/${targetId}/follow`), 200)
        expectStatus(await accountFetch(target, `/api/user/${actorId}/follow`), 200)
        expectStatus(await accountFetch(actor, "/api/profile/filters/mute", { target: target.user.id }), 200)
        expectStatus(await accountFetch(actor, "/api/profile/filters/mute", { target: target.user.id }), 200)
        expectStatus(await accountFetch(actor, "/api/profile/filters/block", { target: target.user.id }), 200)
        expectStatus(await accountFetch(actor, `/api/user/${targetId}/follow`), 403)
        expectStatus(await accountFetch(target, `/api/user/${actorId}/follow`), 403)
        expectStatus(await accountFetch(actor, "/api/profile/referral", { referral: targetId }), 403, "blocked referral stage")
        expectStatus(await accountFetch(target, "/api/profile/referral", { referral: actorId }), 403, "blocked-by referral stage")
        const referralClaims = await admin.query<Array<Array<string>>>(`
            SELECT VALUE claimant
            FROM referralClaim
            WHERE claimant IN [${actor.user.id}, ${target.user.id}];
        `)
        expect(referralClaims.flat()).toHaveLength(0)
        await assertBlockedInteractions(actor, target)

        let filters = await getFilters(actor)
        expect(filters.muted.filter(user => user.id === target.user.id)).toHaveLength(1)
        expect(filters.blocked.filter(user => user.id === target.user.id)).toHaveLength(1)

        let actorProfile = await accountFetch(actor, "/api/profile/authenticate")
        let targetProfile = await accountFetch(target, "/api/profile/authenticate")
        expect((await actorProfile.json() as User).following).not.toContain(target.user.id)
        expect((await targetProfile.json() as User).following).not.toContain(actor.user.id)

        expectStatus(await accountFetch(actor, "/api/profile/filters/unblock", { target: target.user.id }), 200)
        filters = await getFilters(actor)
        expect(filters.blocked.filter(user => user.id === target.user.id)).toHaveLength(0)
        expect(filters.muted.filter(user => user.id === target.user.id)).toHaveLength(1)

        actorProfile = await accountFetch(actor, "/api/profile/authenticate")
        targetProfile = await accountFetch(target, "/api/profile/authenticate")
        expect((await actorProfile.json() as User).following).not.toContain(target.user.id)
        expect((await targetProfile.json() as User).following).not.toContain(actor.user.id)

        expectStatus(await accountFetch(actor, "/api/profile/filters/unmute", { target: target.user.id }), 200)
        filters = await getFilters(actor)
        expect(filters.muted).toHaveLength(0)
    }
    finally {
        await cleanupTestData(accounts, actionPostId, actionTopicId)
    }
})

it("mutes and blocks topics, and does not restore a follow after unblocking", async () => {
    const accounts: FilterTestAccount[] = []
    const topicId = `filterTopic${randomUUID().replaceAll("-", "").slice(0, 12)}`
    let postId: string | undefined
    let threadId: string | undefined

    try {
        const actor = await createAccount()
        accounts.push(actor)
        const postResponse = await accountFetch(actor, "/api/post/add", {
            title: `Filter topic ${randomUUID().slice(0, 8)}`,
            content: "Topic content for the content-filter integration test.",
            topics: [`topic:${topicId}`],
            images: [],
        })
        expectStatus(postResponse, 200, "filter topic post creation stage")
        postId = extractId((await postResponse.json() as Post).id)
        const quoteTargetResponse = await accountFetch(actor, "/api/thread/add", {
            content: "Topic filter quote target.",
            topics: [],
            images: [],
        })
        expectStatus(quoteTargetResponse, 200, "filter topic quote target stage")
        threadId = extractId((await quoteTargetResponse.json() as Thread).id)

        expectStatus(await accountFetch(actor, `/api/topic/${topicId}/follow`), 200)
        expectStatus(await accountFetch(actor, "/api/profile/filters/mute", { target: `topic:${topicId}` }), 200)
        expectStatus(await accountFetch(actor, `/api/topic/${topicId}/follow`), 200, "muted topic follow stage")
        expectStatus(await accountFetch(actor, "/api/profile/filters/block", { target: `topic:${topicId}` }), 200)
        expectStatus(await accountFetch(actor, `/api/topic/${topicId}/follow`), 403, "blocked topic follow stage")

        const blockedPostResponse = await accountFetch(actor, "/api/post/add", {
            title: `Blocked topic ${randomUUID().slice(0, 8)}`,
            content: "A post to a blocked topic must be rejected.",
            topics: [`topic:${topicId}`],
            images: [],
        })
        expectStatus(blockedPostResponse, 403, "blocked topic post stage")
        const blockedThreadResponse = await accountFetch(actor, "/api/thread/add", {
            content: "A thread to a blocked topic must be rejected.",
            topics: [`topic:${topicId}`],
            images: [],
        })
        expectStatus(blockedThreadResponse, 403, "blocked topic thread stage")
        const blockedQuoteResponse = await accountFetch(actor, `/api/thread/${threadId}/quote`, {
            content: "A quote to a blocked topic must be rejected.",
            topics: [`topic:${topicId}`],
        })
        expectStatus(blockedQuoteResponse, 403, "blocked topic quote stage")
        const blockedLinkResponse = await accountFetch(actor, "/api/link/add", {
            title: `Blocked link ${randomUUID().slice(0, 8)}`,
            url: "https://example.invalid/blocked-topic",
            topics: [`topic:${topicId}`],
        })
        expectStatus(blockedLinkResponse, 403, "blocked topic link stage")
        await admin.query(`UPDATE ${actor.user.id} SET traits = array::union(traits, ["confirmed"]);`)
        const blockedGalleryResponse = await accountFetch(actor, "/api/gallery/publish", {
            images: [`image:blockedTopic${randomUUID().replaceAll("-", "")}`],
            title: "Blocked topic gallery",
            description: "A gallery to a blocked topic must be rejected.",
            topics: [`topic:${topicId}`],
        })
        expectStatus(blockedGalleryResponse, 403, "blocked topic gallery stage")

        let filters = await getFilters(actor)
        expect(filters.muted.map(topic => topic.id)).toContain(`topic:${topicId}`)
        expect(filters.blocked.map(topic => topic.id)).toContain(`topic:${topicId}`)
        let profile = await accountFetch(actor, "/api/profile/authenticate")
        expect((await profile.json() as User).topics).not.toContain(`topic:${topicId}`)

        expectStatus(await accountFetch(actor, "/api/profile/filters/unblock", { target: `topic:${topicId}` }), 200)
        expectStatus(await accountFetch(actor, "/api/profile/filters/unmute", { target: `topic:${topicId}` }), 200)
        filters = await getFilters(actor)
        expect(filters.blocked).toHaveLength(0)
        expect(filters.muted).toHaveLength(0)
        profile = await accountFetch(actor, "/api/profile/authenticate")
        expect((await profile.json() as User).topics).not.toContain(`topic:${topicId}`)
    }
    finally {
        await cleanupTestData(accounts, postId, topicId, threadId)
    }
})

it("filters content from users who block the viewer without hiding direct links", async () => {
    const accounts: FilterTestAccount[] = []
    let postId: string | undefined
    const searchTerm = `blockfilter${randomUUID().replaceAll("-", "")}`

    try {
        const viewer = await createAccount()
        accounts.push(viewer)
        const author = await createAccount()
        accounts.push(author)
        const postResponse = await accountFetch(author, "/api/post/add", {
            title: `Blocked author ${searchTerm}`,
            content: `Unique search text ${searchTerm}`,
            topics: [],
            images: [],
        })
        expectStatus(postResponse, 200, "blocked-author post creation stage")
        postId = extractId((await postResponse.json() as Post).id)

        expectStatus(await accountFetch(author, "/api/profile/filters/block", { target: viewer.user.id }), 200)

        const popularResponse = await accountFetch(viewer, "/api/feed/popular?sortBy=new&pageSize=50")
        expectStatus(popularResponse, 200)
        const popular = await popularResponse.json() as FeedPage<Post<string[]>>
        expect(popular.items.some(post => post.id === `post:${postId}`)).toBe(false)

        const searchResponse = await accountFetch(viewer, `/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(searchResponse, 200)
        const searchResults = await searchResponse.json() as FeedPage<SearchResult>
        expect(searchResults.items.some(post => post.id === `post:${postId}`)).toBe(false)

        const anonymousSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(anonymousSearchResponse, 200)
        const anonymousResults = await anonymousSearchResponse.json() as FeedPage<SearchResult>
        expect(anonymousResults.items.some(post => post.id === `post:${postId}`)).toBe(true)

        const directPostResponse = await accountFetch(viewer, `/api/post/${postId}`)
        expectStatus(directPostResponse, 200)
    }
    finally {
        await cleanupTestData(accounts, postId)
    }
})

it("applies user and topic filters to every dedicated content feed", async () => {
    const accounts: FilterTestAccount[] = []
    const topicId = `dedicatedFilter${randomUUID().replaceAll("-", "").slice(0, 12)}`
    const topic = `topic:${topicId}`
    const imageId = `dedicatedFilter${randomUUID().replaceAll("-", "").slice(0, 12)}`
    const image = `image:${imageId}`
    const records: string[] = []
    let viewer: FilterTestAccount | undefined
    let author: FilterTestAccount | undefined

    try {
        viewer = await createAccount()
        accounts.push(viewer)
        author = await createAccount()
        accounts.push(author)

        await admin.query(`CREATE ONLY ${topic} SET posts = [], threads = [];`)

        const postResponse = await accountFetch(author, "/api/post/add", {
            title: `Dedicated feed post ${randomUUID().slice(0, 8)}`,
            content: "Created for dedicated-feed filter coverage.",
            topics: [topic],
            images: [],
        })
        expectStatus(postResponse, 200, "dedicated-feed post creation stage")
        const post = await postResponse.json() as Post
        records.push(post.id)

        const topicSettings = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        const topicUpdate = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: topicSettings.description ?? "",
                moderation: { ...topicSettings.moderation, maxPostInterval: 0 },
                rules: topicSettings.rules ?? "",
            },
        })
        expectStatus(topicUpdate, 200, "dedicated-feed topic cooldown setup stage")

        const threadResponse = await accountFetch(author, "/api/thread/add", {
            content: "Created for dedicated-feed filter coverage.",
            topics: [topic],
            images: [],
        })
        expectStatus(threadResponse, 200, "dedicated-feed thread creation stage")
        const thread = await threadResponse.json() as Thread
        records.push(thread.id)

        const linkResponse = await accountFetch(author, "/api/link/add", {
            title: `Dedicated feed link ${randomUUID().slice(0, 8)}`,
            url: "http://127.0.0.1/article",
            topics: [topic],
        })
        expectStatus(linkResponse, 200, "dedicated-feed link creation stage")
        const link = await linkResponse.json() as Link
        records.push(link.id)

        await admin.query(`
            UPDATE ${author.user.id} SET traits = array::union(traits, ["confirmed"]);
            CREATE ONLY ${image} SET user = ${author.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;
        `)
        const galleryResponse = await accountFetch(author, "/api/gallery/publish", {
            images: [image],
            title: "Dedicated feed gallery",
            description: "Created for dedicated-feed filter coverage.",
            topics: [topic],
        })
        expectStatus(galleryResponse, 200, "dedicated-feed gallery creation stage")
        const galleryListResponse = await fetch("/api/gallery")
        expectStatus(galleryListResponse, 200, "dedicated-feed gallery lookup stage")
        const galleries = await galleryListResponse.json() as FeedPage<Gallery>
        const gallery = galleries.items.find(item => item.images.some(itemImage => itemImage.id === image))
        expect(gallery).toBeDefined()
        records.push(gallery!.id)

        const postId = extractId(post.id)!
        const feeds = [
            { path: "/api/post", id: post.id },
            { path: "/api/thread", id: thread.id },
            { path: "/api/link", id: link.id },
            { path: "/api/gallery", id: gallery!.id },
        ]
        await expectDedicatedFeeds(viewer, feeds, true, "unfiltered viewer")
        await expectDedicatedFeeds(undefined, feeds, true, "anonymous viewer")

        const filterCases = [
            { action: "mute", removal: "unmute", target: author.user.id },
            { action: "mute", removal: "unmute", target: topic },
            { action: "block", removal: "unblock", target: author.user.id },
            { action: "block", removal: "unblock", target: topic },
        ] as const

        for (const filter of filterCases) {
            const addFilter = await accountFetch(viewer, `/api/profile/filters/${filter.action}`, { target: filter.target })
            expectStatus(addFilter, 200, `${filter.action} ${filter.target} stage`)
            await expectDedicatedFeeds(viewer, feeds, false, `${filter.action} ${filter.target}`)
            await expectDedicatedFeeds(undefined, feeds, true, `anonymous during ${filter.action} ${filter.target}`)

            const directPostResponse = await accountFetch(viewer, `/api/post/${postId}`)
            expectStatus(directPostResponse, 200, `direct post access during ${filter.action} ${filter.target}`)

            const removeFilter = await accountFetch(viewer, `/api/profile/filters/${filter.removal}`, { target: filter.target })
            expectStatus(removeFilter, 200, `${filter.removal} ${filter.target} stage`)
            await expectDedicatedFeeds(viewer, feeds, true, `${filter.removal} ${filter.target}`)
        }

        const reverseBlock = await accountFetch(author, "/api/profile/filters/block", { target: viewer.user.id })
        expectStatus(reverseBlock, 200, "reverse author block stage")
        await expectDedicatedFeeds(viewer, feeds, false, "author blocks viewer")
        await expectDedicatedFeeds(undefined, feeds, true, "anonymous while author blocks viewer")

        const removeReverseBlock = await accountFetch(author, "/api/profile/filters/unblock", { target: viewer.user.id })
        expectStatus(removeReverseBlock, 200, "remove reverse author block stage")
        await expectDedicatedFeeds(viewer, feeds, true, "reverse block removed")
    }
    finally {
        const targets = [
            ...(author ? [author.user.id] : []),
            topic,
        ]
        await clearFilters(accounts, targets)

        const userIds = accounts.map(account => account.user.id)
        const cleanupUsers = userIds.length > 0
            ? `
                DELETE session WHERE account IN (SELECT VALUE id FROM account WHERE user IN [${userIds.join(", ")}]);
                DELETE account WHERE user IN [${userIds.join(", ")}];
                DELETE userSettings WHERE user IN [${userIds.join(", ")}];
                DELETE user WHERE id IN [${userIds.join(", ")}];
            `
            : ""
        await admin.query(`
            ${records.length > 0 ? `DELETE notification WHERE context IN [${records.join(", ")}]; DELETE [${records.join(", ")}];` : ""}
            DELETE ${image};
            ${cleanupUsers}
            DELETE ${topic};
        `)
    }
}, 15_000)

async function assertBlockedInteractions(blocker: FilterTestAccount, blocked: FilterTestAccount) {
    const postIds: string[] = []
    const threadIds: string[] = []
    const commentIds: string[] = []
    const marker = randomUUID().replaceAll("-", "")

    try {
        const blockerPostResponse = await accountFetch(blocker, "/api/post/add", {
            title: `Block interaction ${marker} blocker`,
            content: "Block interaction test post.",
            topics: [],
            images: [],
        })
        expectStatus(blockerPostResponse, 200, "blocker post creation stage")
        const blockerPost = await blockerPostResponse.json() as Post
        postIds.push(blockerPost.id)

        const blockedPostResponse = await accountFetch(blocked, "/api/post/add", {
            title: `Block interaction ${marker} blocked`,
            content: "Block interaction test post.",
            topics: [],
            images: [],
        })
        expectStatus(blockedPostResponse, 200, "blocked user's post creation stage")
        const blockedPost = await blockedPostResponse.json() as Post
        postIds.push(blockedPost.id)

        const blockerThreadResponse = await accountFetch(blocker, "/api/thread/add", {
            content: `Block interaction ${marker} blocker thread`,
            topics: [],
            images: [],
        })
        expectStatus(blockerThreadResponse, 200, "blocker thread creation stage")
        const blockerThread = await blockerThreadResponse.json() as Thread
        threadIds.push(blockerThread.id)

        const blockedThreadResponse = await accountFetch(blocked, "/api/thread/add", {
            content: `Block interaction ${marker} blocked thread`,
            topics: [],
            images: [],
        })
        expectStatus(blockedThreadResponse, 200, "blocked user's thread creation stage")
        const blockedThread = await blockedThreadResponse.json() as Thread
        threadIds.push(blockedThread.id)

        const blockerCommentResponse = await accountFetch(blocker, "/api/comment/add", {
            context: blockerPost.id,
            replyTo: blockerPost.id,
            content: `Block interaction ${marker} blocker comment`,
        })
        expectStatus(blockerCommentResponse, 200, "blocker comment creation stage")
        const blockerComment = await blockerCommentResponse.json() as Comment
        commentIds.push(blockerComment.id)

        const blockedCommentResponse = await accountFetch(blocked, "/api/comment/add", {
            context: blockedPost.id,
            replyTo: blockedPost.id,
            content: `Block interaction ${marker} blocked comment`,
        })
        expectStatus(blockedCommentResponse, 200, "blocked user's comment creation stage")
        const blockedComment = await blockedCommentResponse.json() as Comment
        commentIds.push(blockedComment.id)

        expectStatus(await accountFetch(blocker, `/api/user/${extractId(blocked.user.id)}/award`, {}), 403, "blocking user award stage")
        expectStatus(await accountFetch(blocked, `/api/user/${extractId(blocker.user.id)}/award`, {}), 403, "blocked user award stage")
        expectStatus(await accountFetch(blocker, `/api/post/${extractId(blockedPost.id)}/award`, {}), 403, "blocking user post award stage")
        expectStatus(await accountFetch(blocked, `/api/post/${extractId(blockerPost.id)}/award`, {}), 403, "blocked user post award stage")
        expectStatus(await accountFetch(blocker, `/api/thread/${extractId(blockedThread.id)}/award`, {}), 403, "blocking user thread award stage")
        expectStatus(await accountFetch(blocked, `/api/thread/${extractId(blockerThread.id)}/award`, {}), 403, "blocked user thread award stage")
        expectStatus(await accountFetch(blocker, `/api/comment/${extractId(blockedComment.id)}/award`, {}), 403, "blocking user comment award stage")
        expectStatus(await accountFetch(blocked, `/api/comment/${extractId(blockerComment.id)}/award`, {}), 403, "blocked user comment award stage")

        await expectBlockedInteraction(await accountFetch(blocked, "/api/comment/add", {
            context: blockerPost.id,
            replyTo: blockerPost.id,
            content: `Block interaction ${marker} blocked-to-blocker comment`,
        }), commentIds, "blocked user comment stage")
        await expectBlockedInteraction(await accountFetch(blocker, "/api/comment/add", {
            context: blockedPost.id,
            replyTo: blockedPost.id,
            content: `Block interaction ${marker} blocker-to-blocked comment`,
        }), commentIds, "blocking user comment stage")
        await expectBlockedInteraction(await accountFetch(blocked, "/api/comment/add", {
            context: blockerPost.id,
            replyTo: blockerComment.id,
            content: `Block interaction ${marker} blocked-to-blocker reply`,
        }), commentIds, "blocked user comment reply stage")
        await expectBlockedInteraction(await accountFetch(blocker, "/api/comment/add", {
            context: blockedPost.id,
            replyTo: blockedComment.id,
            content: `Block interaction ${marker} blocker-to-blocked reply`,
        }), commentIds, "blocking user comment reply stage")
        await expectBlockedInteraction(await accountFetch(blocked, `/api/thread/${extractId(blockerThread.id)}/reply`, {
            content: `Block interaction ${marker} blocked-to-blocker thread reply`,
        }), threadIds, "blocked user thread reply stage")
        await expectBlockedInteraction(await accountFetch(blocker, `/api/thread/${extractId(blockedThread.id)}/reply`, {
            content: `Block interaction ${marker} blocker-to-blocked thread reply`,
        }), threadIds, "blocking user thread reply stage")

        const comments = await admin.query<Array<Array<Pick<Comment, "id" | "content">>>>(`
            SELECT id, content FROM comment
            WHERE content IN [
                "Block interaction ${marker} blocker comment",
                "Block interaction ${marker} blocked comment",
                "Block interaction ${marker} blocked-to-blocker comment",
                "Block interaction ${marker} blocker-to-blocked comment",
                "Block interaction ${marker} blocked-to-blocker reply",
                "Block interaction ${marker} blocker-to-blocked reply"
            ];
        `)
        expect(comments.flat().map(comment => comment.content).sort()).toEqual([
            `Block interaction ${marker} blocked comment`,
            `Block interaction ${marker} blocker comment`,
        ].sort())
        const threads = await admin.query<Array<Array<Pick<Thread, "id" | "content">>>>(`
            SELECT id, content FROM thread
            WHERE content IN [
                "Block interaction ${marker} blocker thread",
                "Block interaction ${marker} blocked thread",
                "Block interaction ${marker} blocked-to-blocker thread reply",
                "Block interaction ${marker} blocker-to-blocked thread reply"
            ];
        `)
        expect(threads.flat().map(thread => thread.content).sort()).toEqual([
            `Block interaction ${marker} blocked thread`,
            `Block interaction ${marker} blocker thread`,
        ].sort())
    }
    finally {
        const records = [...commentIds, ...threadIds, ...postIds]
        const notificationContexts = [...postIds, ...threadIds, ...commentIds]
        const cleanup = [
            notificationContexts.length > 0
                ? `DELETE notification WHERE context IN [${notificationContexts.join(", ")}];`
                : "",
            records.length > 0 ? `DELETE [${records.join(", ")}];` : "",
        ].filter(Boolean)
        if (cleanup.length > 0) await admin.query(cleanup.join("\n"))
    }
}
