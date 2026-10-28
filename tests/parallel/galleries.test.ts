import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Gallery, Topic } from "../../shared/types"

const admin = await grabUser("admin")
const exampleServer = await grabExampleServer("default")
const member = exampleServer.users.sampleUser01

it("does not expose standalone image discovery", async () => {
    const response = await fetch("/api/image")
    expect(response.ok).toBe(false)
})

it("rejects publishing an image owned by another user", async () => {
    const imageId = `foreignGalleryImage${Date.now()}`

    try {
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${member.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [`image:${imageId}`], description: "", topics: [] },
        })
        expectStatus(publishResponse, 403)
    }
    finally {
        await admin.query(`DELETE image:${imageId};`)
    }
})

it("allows other users to attach an image only after gallery publication", async () => {
    const imageId = `galleryAttachment${Date.now()}`
    let galleryId: string | undefined
    let postId: string | undefined

    try {
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        const unpublishedPostResponse = await member.fetchRaw("/api/post/add", {
            method: "POST",
            body: { title: "Unpublished image", content: "This should be rejected.", topics: [], images: [`image:${imageId}`] },
        })
        expectStatus(unpublishedPostResponse, 403)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [`image:${imageId}`], description: "", topics: [] },
        })
        expectStatus(publishResponse, 200)
        const galleries = await admin.fetch<Gallery[]>("/api/gallery")
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const publishedPostResponse = await member.fetchRaw("/api/post/add", {
            method: "POST",
            body: { title: "Published image", content: "This attachment is allowed.", topics: [], images: [`image:${imageId}`] },
        })
        expectStatus(publishedPostResponse, 200)
        postId = extractId(publishedPostResponse._data!.id)
    }
    finally {
        await admin.query([
            ...(postId ? [`DELETE post:${postId};`] : []),
            ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
            `DELETE image:${imageId};`,
        ].join("\n"))
    }
})

it("returns gallery details, increments visits, and denies deletion by a non-owner", async () => {
    const imageId = `galleryDetail${Date.now()}`
    const description = `Gallery detail test ${Date.now()}`
    let galleryId: string | undefined

    try {
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [`image:${imageId}`], description, topics: [] },
        })
        expectStatus(publishResponse, 200)

        const galleriesResponse = await fetch("/api/gallery")
        expectStatus(galleriesResponse, 200)
        const galleries = await galleriesResponse.json() as Gallery[]
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const detailResponse = await fetch(`/api/gallery/${galleryId}`)
        expectStatus(detailResponse, 200, await detailResponse.clone().text())
        const detail = await detailResponse.json() as Gallery
        expect(detail.description).toBe(description)
        expect(detail.images.map(image => image.id)).toContain(`image:${imageId}`)
        expect(detail.user.id).toBe(admin.user.id)

        const visitResponse = await fetch(`/api/gallery/${galleryId}/visit`)
        expectStatus(visitResponse, 200, await visitResponse.clone().text())
        expect(await visitResponse.json()).toBe(detail.visits + 1)

        const deniedDeleteResponse = await member.fetchRaw(`/api/gallery/${galleryId}/delete`)
        expectStatus(deniedDeleteResponse, 403)
    }
    finally {
        await admin.query(`${galleryId ? `DELETE gallery:${galleryId};` : ""} DELETE image:${imageId}; DELETE mediaTrash:${imageId};`)
    }
})

it("rejects gallery publishing without images", async () => {
    const beforeResponse = await fetch("/api/gallery")
    expectStatus(beforeResponse, 200)
    const before = await beforeResponse.json() as Gallery[]

    const response = await admin.fetchRaw("/api/gallery/publish", {
        method: "POST",
        body: { images: [], description: "", topics: [] },
    })
    expectStatus(response, 400)

    const afterResponse = await fetch("/api/gallery")
    expectStatus(afterResponse, 200)
    const after = await afterResponse.json() as Gallery[]
    expect(after.map(gallery => gallery.id)).toEqual(before.map(gallery => gallery.id))
})

it("removes a gallery-only topic after its gallery is deleted", async () => {
    const topicId = `galleryOnly${Date.now()}`
    const imageId = `topicCleanup${Date.now()}`
    const otherImageId = `topicCleanupOther${Date.now()}`
    let galleryId: string | undefined

    try {
        await admin.query(`
            CREATE ONLY topic:${topicId} SET posts = [], threads = [];
            CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;
            CREATE ONLY image:${otherImageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;
        `)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: {
                images: [`image:${imageId}`, `image:${otherImageId}`],
                description: "",
                topics: [`topic:${topicId}`],
            },
        })
        expectStatus(publishResponse, 200)

        const publishedTopicResponse = await fetch(`/api/topic/${topicId}`)
        expectStatus(publishedTopicResponse, 200, await publishedTopicResponse.clone().text())
        const publishedTopic = await publishedTopicResponse.json() as Topic
        expect(publishedTopic.galleries).toHaveLength(1)
        expect(publishedTopic.galleries[0].images).toHaveLength(2)
        expect(publishedTopic.galleries[0].images.map(image => image.id)).toContain(`image:${imageId}`)
        expect(publishedTopic.galleries[0].images.map(image => image.id)).toContain(`image:${otherImageId}`)
        galleryId = extractId(publishedTopic.galleries[0].id)

        const firstDeleteResponse = await admin.fetchRaw(`/api/image/${imageId}/delete`)
        expectStatus(firstDeleteResponse, 409)

        const deleteGalleryResponse = await admin.fetchRaw(`/api/gallery/${galleryId}/delete`)
        expectStatus(deleteGalleryResponse, 200)

        for (const image of [imageId, otherImageId]) {
            const deleteImageResponse = await admin.fetchRaw(`/api/image/${image}/delete`)
            expectStatus(deleteImageResponse, 200)
        }

        const topicsResponse = await fetch("/api/topic")
        expectStatus(topicsResponse, 200)
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
        await admin.query(statements.join(" "))
    }
})