import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser, uniqueTestIp } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, FeedPage, Link, Pin, Post, SearchResult, Sortable } from "../../shared/types"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const otherCommenter = exampleServer.users.commentAuthor
const title = `Integration test post ${Date.now()}`
const content = "Published by the integration test."
const postRequest = {
    title,
    content,
    topics: [],
    images: [],
}

it("rejects post publishing without authentication", async () => {
    const response = await fetch("/api/post/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
        body: JSON.stringify(postRequest),
    })

    expectStatus(response, 401)
})

it("includes published links in the author's feed", async () => {
    const linkId = `userFeedLink${Date.now()}`

    try {
        await admin.query(`
            CREATE ONLY link:${linkId} SET
                user = ${admin.user.id},
                title = "Author feed link",
                url = "https://example.invalid/article";
        `)

        const feed = await admin.fetch<Link[]>(`/api/user/${extractId(admin.user.id)}/feed?sortBy=new`)
        expect(feed.find(item => item.id === `link:${linkId}`)).toMatchObject({
            title: "Author feed link",
            url: "https://example.invalid/article",
            preview: {},
        })
    }
    finally {
        await admin.query(`DELETE link:${linkId};`)
    }
})

it("soft-deletes links with comments using status", async () => {
    const linkId = `linkDelete${Date.now()}`
    const linkRecord = `link:${linkId}`
    let commentId: string | undefined

    try {
        await admin.query(`
            CREATE ONLY ${linkRecord} SET
                user = ${admin.user.id},
                title = "Link to delete",
                url = "https://example.invalid/article";
        `)

        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: {
                context: linkRecord,
                replyTo: linkRecord,
                content: `Link delete comment ${Date.now()}`,
            },
        })
        expectStatus(commentResponse, 200, "link comment creation stage")
        commentId = extractId(commentResponse._data!.id)

        const deleteResponse = await admin.fetchRaw(`/api/link/${linkId}/delete`)
        expectStatus(deleteResponse, 200, "link deletion stage")

        const deletedLinkStatus = await admin.query<string[]>(
            `SELECT VALUE status FROM ONLY ${linkRecord};`,
        )
        expect(deletedLinkStatus[0]).toBe("deleted")

        const deletedLink = await admin.fetch<Link>(`/api/link/${linkId}`)
        expect(deletedLink.status).toBe("deleted")
        expect(deletedLink).not.toHaveProperty("deleted")
    }
    finally {
        await admin.query([
            `DELETE notification WHERE context = ${linkRecord};`,
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            `DELETE ${linkRecord};`,
        ].join("\n"))
    }
})

it("denies app pin and archive actions to developer-only accounts", async () => {
    const username = `DevActions${Date.now()}`
    const password = "DevActionsTest-password"
    const registerResponse = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            email: `${username.toLowerCase()}@example.invalid`,
            password,
        }),
    })
    expectStatus(registerResponse, 200, "developer-only account registration stage")
    const accessToken = await registerResponse.text()

    const profileResponse = await fetch("/api/profile/authenticate", {
        headers: { Authorization: accessToken },
    })
    expectStatus(profileResponse, 200, "developer-only account authentication stage")
    const developer = await profileResponse.json() as { id: string }

    try {
        await admin.query(`UPDATE ${developer.id} SET roles = ["developer"];`)

        const protectedActions = [
            "/api/post/missing/archive",
            "/api/thread/missing/archive",
            "/api/gallery/missing/archive",
            "/api/link/missing/archive",
            "/api/post/missing/pin",
            "/api/thread/missing/pin",
            "/api/gallery/missing/pin",
            "/api/link/missing/pin",
            "/api/admin/pin/missing/delete",
        ]
        for (const path of protectedActions) {
            const response = await fetch(path, {
                method: "POST",
                headers: { Authorization: accessToken },
            })
            expectStatus(response, 403, `developer-only authorization for ${path}`)
        }

        const updatePinResponse = await fetch("/api/admin/pin/missing/update", {
            method: "POST",
            headers: { Authorization: accessToken, "Content-Type": "application/json" },
            body: JSON.stringify({ active: true }),
        })
        expectStatus(updatePinResponse, 403, "developer-only app pin update authorization")
    }
    finally {
        await admin.query(`
            DELETE session WHERE id = ${accessToken};
            DELETE userSettings WHERE user = ${developer.id};
            DELETE account WHERE user = ${developer.id};
            DELETE ${developer.id};
        `)
    }
})

it("archives and app-pins links for administrators", async () => {
    const linkId = `linkActions${Date.now()}`
    const linkRecord = `link:${linkId}`
    const postId = `postActions${Date.now()}`
    const galleryId = `galleryActions${Date.now()}`
    const archiveTargets = [
        { type: "post", id: postId, record: `post:${postId}` },
        { type: "gallery", id: galleryId, record: `gallery:${galleryId}` },
        { type: "link", id: linkId, record: linkRecord },
    ]

    try {
        await admin.query(`
            CREATE ONLY post:${postId} SET
                user = ${admin.user.id},
                title = "Post actions test",
                content = "Archive action test.";
            CREATE ONLY gallery:${galleryId} SET
                user = ${admin.user.id},
                description = "Gallery actions test",
                images = [];
            CREATE ONLY ${linkRecord} SET
                user = ${admin.user.id},
                title = "Link actions test",
                url = "https://example.invalid/actions";
        `)

        for (const target of archiveTargets) {
            const archive = () => admin.fetchRaw(`/api/${target.type}/${target.id}/archive`, { method: "POST" })
            expectStatus(await archive(), 200)
            expect((await admin.query<string[]>(`SELECT VALUE status FROM ONLY ${target.record};`))[0]).toBe("archived")
            expectStatus(await archive(), 200)
            expect((await admin.query<string[]>(`SELECT VALUE status FROM ONLY ${target.record};`))[0]).toBe("active")
        }

        const pinResponse = await admin.fetchRaw<Pin>(`/api/link/${linkId}/pin`, { method: "POST" })
        expectStatus(pinResponse, 200)
        const pins = await admin.query<Array<Pin[]>>(`SELECT * FROM pin WHERE item = ${linkRecord} AND scope = "app";`)
        expect(pins[0]).toHaveLength(1)
        const managedPins = await admin.fetch<Pin[]>("/api/admin/pin")
        expect(managedPins.find(pin => pin.item.id === linkRecord)?.active).toBe(false)
        const visiblePins = await admin.fetch<Pin[]>("/api/feed/pinned")
        expect(visiblePins.find(pin => pin.item.id === linkRecord)).toBeUndefined()

        expectStatus(await admin.fetchRaw(`/api/admin/pin/${extractId(pinResponse._data!.id)}/update`, {
            method: "POST",
            body: { active: true },
        }), 200)
        const activatedPins = await admin.fetch<Pin[]>("/api/feed/pinned")
        expect(activatedPins.find(pin => pin.item.id === linkRecord)).toBeDefined()
    }
    finally {
        await admin.query(`
            DELETE pin WHERE item = ${linkRecord};
            DELETE pin WHERE item = gallery:${galleryId};
            DELETE pin WHERE item = post:${postId};
            DELETE ${linkRecord};
            DELETE gallery:${galleryId};
            DELETE post:${postId};
        `)
    }
})

it("publishes and deletes an authenticated post", async () => {
    const response = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: postRequest,
    })
    expectStatus(response, 200)

    const post = response._data!
    expect(post.id).toMatch(/^post:/)
    expect(post.title).toBe(title)
    expect(post.content).toBe(content)
    expect(post.user).toBe(admin.user.id)

    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    const deleteResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
    expectStatus(deleteResponse, 200)
})

it("persists supported tags while keeping comments untagged", async () => {
    const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { ...postRequest, title: `Content visibility ${Date.now()}`, tags: ["spoiler"] },
    })
    expectStatus(postResponse, 200)

    const post = postResponse._data!
    const postId = extractId(post.id)
    expect(post.tags).toEqual(["spoiler"])

    let commentId: string | undefined
    try {
        await expect(admin.query(`UPDATE post:${postId} SET tags = ["unsupported"];`)).rejects.toThrow()
        expect((await admin.fetch<Post>(`/api/post/${postId}`)).tags).toEqual(["spoiler"])

        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: {
                context: post.id,
                replyTo: post.id,
                content: `Untagged comment ${Date.now()}`,
                tags: ["nsfw"],
            },
        })
        expectStatus(commentResponse, 200, "comment creation stage")
        const comment = commentResponse._data!
        commentId = extractId(comment.id)
        expect(comment).not.toHaveProperty("tags")
        await expect(admin.query(`UPDATE comment:${commentId} SET tags = ["nsfw"];`)).rejects.toThrow()
    }
    finally {
        await admin.query([
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            `DELETE notification WHERE context = post:${postId};`,
            `DELETE post:${postId};`,
        ].join("\n"))
    }
})

it("allows admins to add post tags without allowing members or authors to remove them", async () => {
    const regularUser = exampleServer.users.commentAuthor
    const title = `Post tag permissions ${Date.now()}`
    let postId: string | undefined

    try {
        const createResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { ...postRequest, title, tags: ["spoiler"] },
        })
        expectStatus(createResponse, 200, "post creation stage")
        postId = extractId(createResponse._data!.id)

        const deniedResponse = await regularUser.fetchRaw(`/api/post/${postId}/tag/add`, {
            method: "POST",
            body: { tag: "nsfw" },
        })
        expectStatus(deniedResponse, 403, "member authorization stage")

        const addResponse = await admin.fetchRaw(`/api/post/${postId}/tag/add`, {
            method: "POST",
            body: { tag: "nsfw" },
        })
        expectStatus(addResponse, 204, "admin tag addition stage")

        const editResponse = await admin.fetchRaw(`/api/post/${postId}/edit`, {
            method: "POST",
            body: { content: "Edited without changing tags.", tags: [] },
        })
        expectStatus(editResponse, 200, "author edit stage")
        expect((await admin.fetch<Post>(`/api/post/${postId}`)).tags).toEqual(["spoiler", "nsfw"])
    }
    finally {
        if (postId) {
            await admin.query(`DELETE notification WHERE context = post:${postId}; DELETE post:${postId};`)
        }
    }
})

it("projects moderation state onto post lists, feed, search, and pinned items", async () => {
    const searchTerm = `projectionmarker${Date.now()}`
    const previewContent = `${searchTerm} ${"preview text ".repeat(60)}`
    const expectedContent = previewContent.slice(0, 512)
    const topicId = `projectionTopic${Date.now()}`
    const response = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { ...postRequest, title: `Moderation ${searchTerm}`, content: previewContent, topics: [`topic:${topicId}`] },
    })
    expectStatus(response, 200, "post creation stage")
    const post = response._data!
    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    try {
        await admin.query(`
            CREATE moderation SET subject = post:${postId}, locked = "item";
            CREATE pin SET item = post:${postId}, user = ${admin.user.id}, active = true;
            CREATE pin SET item = post:${postId}, user = ${admin.user.id}, scope = "topic", topic = topic:${topicId}, active = true;
        `)

        const posts = await admin.fetch<Post[]>("/api/post?sortBy=new")
        expect(posts.find(item => item.id === post.id)).toMatchObject({ content: expectedContent, moderation: { locked: "item" } })

        const topicFeed = await admin.fetch<Sortable[]>(`/api/topic/${topicId}/feed?sortBy=new`)
        expect(topicFeed.find(item => item.id === post.id)).toMatchObject({
            content: expectedContent,
            user: { id: admin.user.id, name: admin.user.name, roles: admin.user.roles },
            moderation: { locked: "item" },
        })

        const userFeed = await admin.fetch<Sortable[]>(`/api/user/${extractId(admin.user.id)}/feed?sortBy=new`)
        expect(userFeed.find(item => item.id === post.id)).toMatchObject({
            content: expectedContent,
            user: { id: admin.user.id, name: admin.user.name, roles: admin.user.roles },
            moderation: { locked: "item" },
        })

        const feed = await admin.fetch<FeedPage<Post>>("/api/feed/popular?sortBy=new&pageSize=50")
        expect(feed.items.find(item => item.id === post.id)).toMatchObject({
            content: expectedContent,
            user: { id: admin.user.id, name: admin.user.name, roles: admin.user.roles },
            moderation: { locked: "item" },
        })

        const searchResults = await admin.fetch<SearchResult[]>(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(searchResults.find(item => item.id === post.id)).toMatchObject({ content: expectedContent, moderation: { locked: "item" } })

        const pins = await admin.fetch<Pin[]>("/api/feed/pinned")
        expect(pins.find(pin => pin.item.id === post.id)?.item).toMatchObject({ content: expectedContent, moderation: { locked: "item" } })

        const topicPins = await admin.fetch<Pin[]>(`/api/topic/${topicId}/pins`)
        expect(topicPins.find(pin => pin.item.id === post.id)?.item).toMatchObject({ content: expectedContent, moderation: { locked: "item" } })

        const managedTopicPins = await admin.fetch<Pin[]>(`/api/topic/${topicId}/pins/manage`)
        expect(managedTopicPins.find(pin => pin.item.id === post.id)?.item).toMatchObject({ content: expectedContent, moderation: { locked: "item" } })

        const adminPins = await admin.fetch<Pin[]>("/api/admin/pin")
        expect(adminPins.find(pin => pin.item.id === post.id)?.item).toMatchObject({ content: expectedContent, moderation: { locked: "item" } })
    }
    finally {
        await admin.query([
            `DELETE pin WHERE item = post:${postId};`,
            `DELETE moderation WHERE subject = post:${postId};`,
            `DELETE notification WHERE context = post:${postId};`,
            `DELETE post:${postId};`,
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("traverses post comments and rejects hard deletion while comments remain", async () => {
    const topicId = `commentReference${Date.now()}`
    const response = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { ...postRequest, title: `Comment reference test ${Date.now()}`, topics: [`topic:${topicId}`] },
    })
    expectStatus(response, 200, "post creation stage")
    const post = response._data!
    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    let commentId: string | undefined
    try {
        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: {
                context: post.id,
                replyTo: post.id,
                content: `Comment reference ${Date.now()}`,
            },
        })
        expectStatus(commentResponse, 200, "comment creation stage")
        const comment = commentResponse._data!
        commentId = extractId(comment.id)

        const commentRouteResponse = await admin.fetchRaw(`/comment/${commentId}`, { redirect: "manual" })
        expectStatus(commentRouteResponse, 302, "comment redirect stage")
        expect(commentRouteResponse.headers.get("location")).toBe(`/post/${postId}#${encodeURIComponent(comment.id)}`)

        const postWithComments = await admin.fetch<Post>(`/api/post/${postId}`)
        expect(postWithComments.comments.map(item => item.id)).toContain(comment.id)
        await expect(admin.query(`DELETE ONLY post:${postId};`)).rejects.toThrow()

        const deletePostResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
        expectStatus(deletePostResponse, 200, "post soft deletion stage")
        const deletedPost = await admin.query<Array<Array<{ deleted: boolean, topics: string[] }>>>(
            `SELECT deleted, topics FROM post:${postId};`,
        )
        expect(deletedPost[0]?.[0]).toMatchObject({ deleted: true, topics: [] })
        const remainingTopics = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM topic WHERE id = topic:${topicId};`)
        expect(remainingTopics[0]).toHaveLength(0)

        const deleteCommentResponse = await admin.fetchRaw(`/api/comment/${commentId}/delete`)
        expectStatus(deleteCommentResponse, 200, "comment deletion stage")

        const postWithoutComments = await admin.fetch<Post>(`/api/post/${postId}`)
        expect(postWithoutComments.comments).toHaveLength(0)
    }
    finally {
        await admin.query([
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            `DELETE post:${postId};`,
            `DELETE notification WHERE context = post:${postId};`,
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})

it("enforces post discussion and direct comment locks", async () => {
    const response = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { ...postRequest, title: `Moderation lock test ${Date.now()}` },
    })
    expectStatus(response, 200, "post creation stage")
    const post = response._data!
    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    const commentIds: string[] = []
    try {
        await admin.query(`CREATE moderation SET subject = post:${postId}, locked = "item";`)
        const blockedDiscussionComment = await admin.fetchRaw("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: post.id, content: "This should be blocked." },
        })
        expectStatus(blockedDiscussionComment, 409, "locked discussion stage")

        await admin.query(`DELETE moderation WHERE subject = post:${postId};`)
        const parentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: post.id, content: `Lock parent ${Date.now()}` },
        })
        expectStatus(parentResponse, 200, "parent comment stage")
        const parent = parentResponse._data!
        const parentId = extractId(parent.id)
        commentIds.push(parentId)

        const childResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: parent.id, content: `Lock child ${Date.now()}` },
        })
        expectStatus(childResponse, 200, "child comment stage")
        const child = childResponse._data!
        const childId = extractId(child.id)
        commentIds.push(childId)

        await admin.query(`CREATE moderation SET subject = comment:${parentId}, locked = "item";`)
        const blockedDirectReply = await admin.fetchRaw("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: parent.id, content: "This direct reply should be blocked." },
        })
        expectStatus(blockedDirectReply, 409, "locked comment stage")

        const allowedDescendantReply = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: post.id, replyTo: child.id, content: `Allowed descendant ${Date.now()}` },
        })
        expectStatus(allowedDescendantReply, 200, "direct-only comment lock stage")
        commentIds.push(extractId(allowedDescendantReply._data!.id))
    }
    finally {
        await admin.query([
            `DELETE moderation WHERE subject = post:${postId} OR subject IN [${commentIds.map(id => `comment:${id}`).join(", ")}];`,
            ...commentIds.reverse().map(id => `DELETE comment:${id};`),
            `DELETE notification WHERE context = post:${postId};`,
            `DELETE post:${postId};`,
        ].join("\n"))
    }
})

it("enforces per-user discussion slow mode for nested and concurrent comments", async () => {
    const firstPostId = `slowModePost${Date.now()}`
    const secondPostId = `slowModeConcurrent${Date.now()}`
    const commentIds: string[] = []

    try {
        await admin.query(`
            CREATE ONLY post:${firstPostId} SET user = ${admin.user.id}, title = "Slow mode discussion", content = "Comment cooldown test.";
            CREATE moderation SET subject = post:${firstPostId}, slowed = 30;
        `)

        const firstCommentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: `post:${firstPostId}`, replyTo: `post:${firstPostId}`, content: `First slow comment ${Date.now()}` },
        })
        expectStatus(firstCommentResponse, 200, "first comment stage")
        const firstComment = firstCommentResponse._data!
        commentIds.push(extractId(firstComment.id))

        const blockedNestedReply = await admin.fetchRaw("/api/comment/add", {
            method: "POST",
            body: { context: `post:${firstPostId}`, replyTo: firstComment.id, content: "This nested reply is too soon." },
        })
        expectStatus(blockedNestedReply, 429, "same-user nested cooldown stage")

        const otherUserResponse = await otherCommenter.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: `post:${firstPostId}`, replyTo: firstComment.id, content: `Other user slow comment ${Date.now()}` },
        })
        expectStatus(otherUserResponse, 200, "per-user cooldown isolation stage")
        commentIds.push(extractId(otherUserResponse._data!.id))

        await admin.query(`
            CREATE ONLY post:${secondPostId} SET user = ${admin.user.id}, title = "Concurrent slow mode", content = "Concurrent comment cooldown test.";
            CREATE moderation SET subject = post:${secondPostId}, slowed = 30;
        `)
        const concurrentResponses = await Promise.all([
            admin.fetchRaw("/api/comment/add", {
                method: "POST",
                body: { context: `post:${secondPostId}`, replyTo: `post:${secondPostId}`, content: `Concurrent comment A ${Date.now()}` },
            }),
            admin.fetchRaw("/api/comment/add", {
                method: "POST",
                body: { context: `post:${secondPostId}`, replyTo: `post:${secondPostId}`, content: `Concurrent comment B ${Date.now()}` },
            }),
        ])
        for (const response of concurrentResponses) {
            if (response.status === 200) commentIds.push(extractId(response._data!.id))
        }
        expect(concurrentResponses.every(response => response.status === 200 || response.status === 429)).toBe(true)
        expect(concurrentResponses.some(response => response.status === 200)).toBe(true)

        const blockedAfterConcurrentSubmissions = await admin.fetchRaw("/api/comment/add", {
            method: "POST",
            body: { context: `post:${secondPostId}`, replyTo: `post:${secondPostId}`, content: "This comment is still within the cooldown." },
        })
        expectStatus(blockedAfterConcurrentSubmissions, 429, "post-concurrency cooldown stage")
    }
    finally {
        await admin.query([
            `DELETE notification WHERE context IN [post:${firstPostId}, post:${secondPostId}];`,
            ...commentIds.map(id => `DELETE comment:${id};`),
            `DELETE moderation WHERE subject IN [post:${firstPostId}, post:${secondPostId}];`,
            `DELETE post:${firstPostId};`,
            `DELETE post:${secondPostId};`,
        ].join("\n"))
    }
})