import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, FeedPage, Pin, Post, SearchResult, Sortable } from "../../shared/types"

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postRequest),
    })

    expectStatus(response, 401)
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

it("projects moderation state onto post lists, feed, search, and pinned items", async () => {
    const searchTerm = `projectionmarker${Date.now()}`
    const topicId = `projectionTopic${Date.now()}`
    const response = await admin.fetchRaw<Post>("/api/post/add", {
        method: "POST",
        body: { ...postRequest, title: `Moderation ${searchTerm}`, topics: [`topic:${topicId}`] },
    })
    expectStatus(response, 200, "post creation stage")
    const post = response._data!
    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    try {
        await admin.query(`
            CREATE moderation SET subject = post:${postId}, locked = "item";
            CREATE pin SET item = post:${postId}, user = ${admin.user.id}, active = true;
        `)

        const posts = await admin.fetch<Post[]>("/api/post?sortBy=new")
        expect(posts.find(item => item.id === post.id)).toMatchObject({ moderation: { locked: "item" } })

        const topicFeed = await admin.fetch<Sortable[]>(`/api/topic/${topicId}/feed?sortBy=new`)
        expect(topicFeed.find(item => item.id === post.id)).toMatchObject({ moderation: { locked: "item" } })

        const userFeed = await admin.fetch<Sortable[]>(`/api/user/${extractId(admin.user.id)}/feed?sortBy=new`)
        expect(userFeed.find(item => item.id === post.id)).toMatchObject({ moderation: { locked: "item" } })

        const feed = await admin.fetch<FeedPage<Post>>("/api/feed/popular?sortBy=new&pageSize=50")
        expect(feed.items.find(item => item.id === post.id)).toMatchObject({ moderation: { locked: "item" } })

        const searchResults = await admin.fetch<SearchResult[]>(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(searchResults.find(item => item.id === post.id)).toMatchObject({ moderation: { locked: "item" } })

        const pins = await admin.fetch<Pin[]>("/api/feed/pinned")
        expect(pins.find(pin => pin.item.id === post.id)?.item).toMatchObject({ moderation: { locked: "item" } })

        const adminPins = await admin.fetch<Pin[]>("/api/admin/pin")
        expect(adminPins.find(pin => pin.item.id === post.id)?.item).toMatchObject({ moderation: { locked: "item" } })
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