import { expect, it } from "vitest"
import { expectStatus, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Post, Topic } from "../../shared/types"

const admin = await grabUser("admin")

it("creates and traverses a referenced topic, then removes it when its post is deleted", async () => {
    const topicId = `topicReference${Date.now()}`
    const otherTopicId = `topicReferenceOther${Date.now()}`
    let postId: string | undefined
    let otherPostId: string | undefined

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

        const createdTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(createdTopic.moderation).toEqual({
            maxPostInterval: 60,
            priorityReportThreshold: 5,
        })

        const blockedThreadResponse = await admin.fetchRaw("/api/thread/add", {
            method: "POST",
            body: {
                content: "Attempted during the topic cooldown.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(blockedThreadResponse, 429, "topic posting interval stage")

        const otherPostResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: "A different topic remains available",
                content: "A recent post in another topic must not block this one.",
                topics: [`topic:${otherTopicId}`],
                images: [],
            },
        })
        expectStatus(otherPostResponse, 200, "independent topic posting stage")
        otherPostId = extractId(otherPostResponse._data!.id)

        const updatedDefaults = {
            maxPostInterval: 120,
            priorityReportThreshold: 3,
        }
        const updateResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "Topic settings test",
                moderation: updatedDefaults,
            },
        })
        expectStatus(updateResponse, 200, "topic defaults update stage")
        const updatedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(updatedTopic.moderation).toEqual(updatedDefaults)

        const invalidUpdateResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
            method: "POST",
            body: {
                description: "Invalid topic settings test",
                moderation: {
                    ...updatedDefaults,
                    priorityReportThreshold: 0,
                },
            },
        })
        expectStatus(invalidUpdateResponse, 400, "topic defaults validation stage")
        const unchangedTopic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
        expect(unchangedTopic.moderation).toEqual(updatedDefaults)

        const deleteResponse = await admin.fetchRaw(`/api/post/${postId}/delete`)
        expectStatus(deleteResponse, 200, "post deletion stage")

        const remainingTopics = await admin.query<Array<Array<string>>>(`SELECT VALUE id FROM topic WHERE id = topic:${topicId};`)
        expect(remainingTopics[0]).toHaveLength(0)
    }
    finally {
        await admin.query([
            ...(postId ? [`DELETE post:${postId};`] : []),
            ...(otherPostId ? [`DELETE post:${otherPostId};`] : []),
            `DELETE topic:${topicId};`,
            `DELETE topic:${otherTopicId};`,
        ].join("\n"))
    }
})