import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, Post } from "../../shared/types"

const admin = await grabUser("admin")
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