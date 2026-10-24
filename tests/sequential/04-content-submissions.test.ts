import { expect, it } from "vitest"
import { fetch, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Gallery, Post, Topic, Thread } from "../../shared/types"

const admin = await grabUser("admin")
const title = `Integration test post ${Date.now()}`
const content = "Published by the sequential API integration test."
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

    expect(response.status).toBe(401)
})

it("publishes an authenticated post", async () => {
    const response = await fetch("/api/post/add", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(postRequest),
    })
    expect(response.status).toBe(200)

    const post = await response.json() as Post
    expect(post.id).toMatch(/^post:/)
    expect(post.title).toBe(title)
    expect(post.content).toBe(content)
    expect(post.user).toBe(admin.user.id)

    const postId = extractId(post.id)
    expect(postId).toBeDefined()

    const deleteResponse = await fetch(`/api/post/${postId}/delete`, {
        headers: { Authorization: admin.accessToken },
    })
    expect(deleteResponse.status).toBe(200)
})

it("publishes and deletes an authenticated thread with its only topic", async () => {
    const topicId = `deletedThread${Date.now()}`
    let threadId: string | undefined

    try {
        const response = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: "Created by the topic thread deletion regression test.",
                topics: [`topic:${topicId}`],
                images: [],
            }),
        })
        expect(response.status, await response.clone().text()).toBe(200)
        const thread = await response.json() as Thread
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        const deleteResponse = await fetch(`/api/thread/${threadId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(deleteResponse.status, await deleteResponse.clone().text()).toBe(200)

        const topicsResponse = await fetch("/api/topic")
        expect(topicsResponse.status).toBe(200)
        const topics = await topicsResponse.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(false)
    }
    finally {
        const statements = [
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            `DELETE topic:${topicId};`,
        ]
        await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: statements.join(" ") }),
        })
    }
})

it("rejects gallery publishing without images", async () => {
    const beforeResponse = await fetch("/api/gallery")
    expect(beforeResponse.status).toBe(200)
    const before = await beforeResponse.json() as Gallery[]

    const response = await fetch("/api/gallery/publish", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: [], description: "", topics: [] }),
    })
    expect(response.status, await response.clone().text()).toBe(400)

    const afterResponse = await fetch("/api/gallery")
    expect(afterResponse.status).toBe(200)
    const after = await afterResponse.json() as Gallery[]
    expect(after.map(gallery => gallery.id)).toEqual(before.map(gallery => gallery.id))
})

it("removes a gallery-only topic after its gallery is deleted", async () => {
    const topicId = `galleryOnly${Date.now()}`
    const imageId = `topicCleanup${Date.now()}`
    const otherImageId = `topicCleanupOther${Date.now()}`
    let galleryId: string | undefined

    try {
        const createResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `
                    CREATE ONLY topic:${topicId} SET posts = [], threads = [];
                    CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;
                    CREATE ONLY image:${otherImageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;
                `,
            }),
        })
        expect(createResponse.status, await createResponse.clone().text()).toBe(200)

        const publishResponse = await fetch("/api/gallery/publish", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                images: [`image:${imageId}`, `image:${otherImageId}`],
                description: "",
                topics: [`topic:${topicId}`],
            }),
        })
        expect(publishResponse.status, await publishResponse.clone().text()).toBe(200)

        const publishedTopicResponse = await fetch(`/api/topic/${topicId}`)
        expect(publishedTopicResponse.status, await publishedTopicResponse.clone().text()).toBe(200)
        const publishedTopic = await publishedTopicResponse.json() as Topic
        expect(publishedTopic.galleries).toHaveLength(1)
        expect(publishedTopic.galleries[0].images).toHaveLength(2)
        expect(publishedTopic.galleries[0].images.map(image => image.id)).toContain(`image:${imageId}`)
        expect(publishedTopic.galleries[0].images.map(image => image.id)).toContain(`image:${otherImageId}`)
        galleryId = extractId(publishedTopic.galleries[0].id)

        const firstDeleteResponse = await fetch(`/api/image/${imageId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(firstDeleteResponse.status, await firstDeleteResponse.clone().text()).toBe(409)

        const deleteGalleryResponse = await fetch(`/api/gallery/${galleryId}/delete`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(deleteGalleryResponse.status, await deleteGalleryResponse.clone().text()).toBe(200)

        for (const image of [imageId, otherImageId]) {
            const deleteImageResponse = await fetch(`/api/image/${image}/delete`, {
                headers: { Authorization: admin.accessToken },
            })
            expect(deleteImageResponse.status, await deleteImageResponse.clone().text()).toBe(200)
        }

        const topicsResponse = await fetch("/api/topic")
        expect(topicsResponse.status).toBe(200)
        const topics = await topicsResponse.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(false)
    }
    finally {
        const statements = [
            ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
            `DELETE image:${imageId};`,
            `DELETE image:${otherImageId};`,
            `DELETE mediaTrash:${imageId};`,
            `DELETE mediaTrash:${otherImageId};`,
            `DELETE topic:${topicId};`,
        ]
        await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: statements.join(" ") }),
        })
    }
})