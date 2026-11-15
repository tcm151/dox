import { expect, it } from "vitest"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, Gallery, Topic } from "../../shared/types"

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
            body: { images: [`image:${imageId}`], title: "Foreign image", description: "", topics: [] },
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
            body: { images: [`image:${imageId}`], title: "Attachment gallery", description: "", topics: [] },
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
            body: { images: [`image:${imageId}`], title: "Gallery detail", description, topics: [] },
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

it("allows owners to edit gallery descriptions and denies other users", async () => {
    const imageId = `galleryEdit${Date.now()}`
    const description = `Original gallery description ${Date.now()}`
    const updatedDescription = `Updated gallery description ${Date.now()}`
    let galleryId: string | undefined

    try {
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)
        expectStatus(await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [`image:${imageId}`], title: "Gallery edit", description, topics: [] },
        }), 200)

        const galleries = await admin.fetch<Gallery[]>("/api/gallery")
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const endpoint = `/api/gallery/${galleryId}/edit`
        const denied = await member.fetchRaw(endpoint, { method: "POST", body: { description: updatedDescription } })
        expectStatus(denied, 403)

        const invalid = await admin.fetchRaw(endpoint, { method: "POST", body: { description: 123 } })
        expectStatus(invalid, 400)

        const edit = await admin.fetchRaw(endpoint, { method: "POST", body: { description: updatedDescription } })
        expectStatus(edit, 200)
        expect((await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)).description).toBe(updatedDescription)
    }
    finally {
        await admin.query([...(galleryId ? [`DELETE gallery:${galleryId};`] : []), `DELETE image:${imageId};`, `DELETE mediaTrash:${imageId};`].join("\n"))
    }
})

it("allows admins to add gallery tags and denies regular members", async () => {
    const imageId = `galleryTag${Date.now()}`
    const description = `Gallery tag permissions ${Date.now()}`
    const regularUser = exampleServer.users.commentAuthor
    let galleryId: string | undefined

    try {
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [`image:${imageId}`], title: "Gallery tags", description, topics: [], tags: ["spoiler"] },
        })
        expectStatus(publishResponse, 200, "gallery publication stage")

        const galleries = await admin.fetch<Gallery[]>("/api/gallery")
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const deniedResponse = await regularUser.fetchRaw(`/api/gallery/${galleryId}/tag/add`, {
            method: "POST",
            body: { tag: "nsfw" },
        })
        expectStatus(deniedResponse, 403, "member authorization stage")

        const addResponse = await admin.fetchRaw(`/api/gallery/${galleryId}/tag/add`, {
            method: "POST",
            body: { tag: "nsfw" },
        })
        expectStatus(addResponse, 204, "admin tag addition stage")
        expect((await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)).tags).toEqual(["spoiler", "nsfw"])
    }
    finally {
        await admin.query([
            ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
            `DELETE image:${imageId};`,
            `DELETE mediaTrash:${imageId};`,
        ].join("\n"))
    }
})

it("rejects gallery publishing without images", async () => {
    const description = `empty gallery ${Date.now()}`

    const response = await admin.fetchRaw("/api/gallery/publish", {
        method: "POST",
        body: { images: [], title: "Empty gallery", description, topics: [] },
    })
    expectStatus(response, 400)

    const galleries = await admin.fetch<Gallery[]>("/api/gallery")
    expect(galleries.some(gallery => gallery.description === description)).toBe(false)
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
                title: "Topic cleanup gallery",
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

it("supports gallery comments, replies, retrieval, and reference-protected deletion", async () => {
    const imageId = `galleryComments${Date.now()}`
    const description = `Gallery comments ${Date.now()}`
    let galleryId: string | undefined
    let commentId: string | undefined
    let replyId: string | undefined

    try {
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)
        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [`image:${imageId}`], title: "Gallery comments", description, topics: [] },
        })
        expectStatus(publishResponse, 200, "gallery publication stage")

        const galleries = await admin.fetch<Gallery[]>("/api/gallery")
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: gallery!.id, replyTo: gallery!.id, content: `Gallery comment ${Date.now()}` },
        })
        expectStatus(commentResponse, 200, "gallery comment creation stage")
        const comment = commentResponse._data!
        commentId = extractId(comment.id)
        expect(comment.user).toBe(admin.user.id)
        expect(comment.context).toBe(gallery!.id)

        const replyResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: gallery!.id, replyTo: comment.id, content: `Gallery reply ${Date.now()}` },
        })
        expectStatus(replyResponse, 200, "gallery comment reply stage")
        const reply = replyResponse._data!
        replyId = extractId(reply.id)
        expect(reply.user).toBe(admin.user.id)
        expect(reply.context).toBe(gallery!.id)
        expect(reply.replyTo).toBe(comment.id)

        await admin.query(`
            UPDATE comment:${commentId} SET time = time::now() - 2s;
            UPDATE comment:${replyId} SET time = time::now() - 1s;
        `)
        const detail = await admin.fetch<Gallery>(`/api/gallery/${galleryId}?sortBy=new`)
        expect(detail.comments.map(item => item.id)).toEqual([reply.id, comment.id])
        expect(detail.comments[0]?.user.id).toBe(admin.user.id)
        expect(detail.comments[0]?.context).toBe(gallery!.id)
        await expect(admin.query(`DELETE ONLY gallery:${galleryId};`)).rejects.toThrow()

        const editedContent = `Edited gallery comment ${Date.now()}`
        expectStatus(await admin.fetchRaw(`/api/comment/${commentId}/edit`, {
            method: "POST",
            body: { content: editedContent },
        }), 200, "gallery comment edit stage")
        const editedDetail = await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)
        const editedComment = editedDetail.comments.find(item => item.id === comment.id)
        expect(editedComment).toMatchObject({ content: editedContent, edited: true })
        expect(editedComment?.timeEdited).toBeTruthy()

        expectStatus(await admin.fetchRaw(`/api/comment/${commentId}/delete`), 200, "parent comment soft deletion stage")
        const deletedComment = (await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)).comments.find(item => item.id === comment.id)
        expect(deletedComment?.deleted).toBe(true)
        expectStatus(await admin.fetchRaw(`/api/comment/${replyId}/delete`), 200, "reply deletion stage")
        expectStatus(await admin.fetchRaw(`/api/comment/${commentId}/delete`), 200, "parent comment deletion stage")

        const emptyDetail = await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)
        expect(emptyDetail.comments).toHaveLength(0)
        expectStatus(await admin.fetchRaw(`/api/gallery/${galleryId}/delete`), 200, "gallery deletion stage")
    }
    finally {
        await admin.query([
            ...(replyId ? [`DELETE comment:${replyId};`] : []),
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
            `DELETE image:${imageId};`,
            `DELETE mediaTrash:${imageId};`,
            ...(galleryId ? [`DELETE notification WHERE context = gallery:${galleryId};`] : []),
        ].join("\n"))
    }
})