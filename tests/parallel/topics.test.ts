import { expect, it } from "vitest"
import { expectStatus, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Post } from "../../shared/types"

const admin = await grabUser("admin")

it("creates and traverses a referenced topic, then removes it when its post is deleted", async () => {
    const topicId = `topicReference${Date.now()}`
    let postId: string | undefined

    try {
        const response = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Topic reference ${Date.now()}`,
                content: "Created by the topic reference integration test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(response, 200, "post creation stage")
        const post = response._data!
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        const topicPosts = await admin.query<Array<Array<string[]>>>(`SELECT VALUE posts FROM topic:${topicId};`)
        expect(topicPosts[0]?.[0]).toContain(post.id)

        const deleteResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
        expectStatus(deleteResponse, 200, "post deletion stage")

        const remainingTopics = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM topic WHERE id = topic:${topicId};`)
        expect(remainingTopics[0]).toHaveLength(0)
    }
    finally {
        await admin.query([
            ...(postId ? [`DELETE post:${postId};`] : []),
            `DELETE topic:${topicId};`,
        ].join("\n"))
    }
})