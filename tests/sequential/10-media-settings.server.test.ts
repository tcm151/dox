import { expect, it } from "vitest"
import type { AppSettings, FeedPage, Gallery, Post, Thread } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")

it("enforces gallery and attachment policies independently and preserves existing media", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const updateSettings = (settings: AppSettings) => admin.fetchRaw(
        `/api/admin/settings/${extractId(settings.id)}/update`,
        { method: "POST", body: settings },
    )
    const marker = Date.now()
    const imageId = `mediaPolicy${marker}`
    const imageRecord = `image:${imageId}`
    const postIds: string[] = []
    const threadIds: string[] = []
    let galleryId: string | undefined

    try {
        await admin.query(`CREATE ONLY ${imageRecord} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        const galleryDisabled: AppSettings = {
            ...originalSettings,
            media: {
                ...originalSettings.media,
                images: {
                    ...originalSettings.media.images,
                    enabled: true,
                    attachments: { posts: true, threads: false },
                },
                gallery: { enabled: false },
            },
            feeds: {
                ...originalSettings.feeds,
                images: true,
            },
        }
        expectStatus(await updateSettings(galleryDisabled), 200, "disable gallery publishing and thread attachments")
        expect((await admin.fetch<AppSettings>("/api/settings/default")).feeds.images).toBe(true)

        expectStatus(await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [imageRecord], title: "Disabled gallery", description: "", topics: [] },
        }), 403)

        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Image policy post ${marker}`,
                content: "This post is allowed to attach an image.",
                topics: [],
                images: [imageRecord],
            },
        })
        expectStatus(postResponse, 200, "allow post attachments while gallery publishing is disabled")
        const parentPost = postResponse._data!
        const parentPostId = extractId(parentPost.id)
        expect(parentPostId).toBeDefined()
        postIds.push(parentPostId!)

        expectStatus(await admin.fetchRaw("/api/thread/add", {
            method: "POST",
            body: {
                content: "This thread attachment is disabled.",
                topics: [],
                images: [imageRecord],
            },
        }), 403, "disable thread attachments independently")

        const postAttachmentsDisabled: AppSettings = {
            ...originalSettings,
            media: {
                ...originalSettings.media,
                images: {
                    ...originalSettings.media.images,
                    enabled: true,
                    attachments: { posts: false, threads: true },
                },
                gallery: { enabled: true },
            },
        }
        expectStatus(await updateSettings(postAttachmentsDisabled), 200, "enable gallery and thread attachments only")

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [imageRecord], title: "Enabled gallery", description: "", topics: [] },
        })
        expectStatus(publishResponse, 200, "allow gallery publishing while post attachments are disabled")
        const galleries = await admin.fetch<FeedPage<Gallery>>("/api/gallery")
        const gallery = galleries.items.find(item => item.images.some(image => image.id === imageRecord))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        expectStatus(await admin.fetchRaw("/api/post/add", {
            method: "POST",
            body: {
                title: `Disabled image post ${marker}`,
                content: "This post must not attach an image.",
                topics: [],
                images: [imageRecord],
            },
        }), 403, "disable post attachments")

        expectStatus(await admin.fetchRaw("/api/post/add", {
            method: "POST",
            body: {
                title: `Disabled image reply ${marker}`,
                content: "Replies follow the post attachment setting.",
                replyTo: parentPost.id,
                topics: [],
                images: [imageRecord],
            },
        }), 403, "disable image attachments to replies")

        const threadResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: {
                content: "This thread attachment remains allowed.",
                topics: [],
                images: [imageRecord],
            },
        })
        expectStatus(threadResponse, 200, "allow thread attachments while post attachments are disabled")
        const threadId = extractId(threadResponse._data!.id)
        expect(threadId).toBeDefined()
        threadIds.push(threadId!)

        const postWithoutImages = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Text-only policy post ${marker}`,
                content: "Posts without images remain allowed.",
                topics: [],
                images: [],
            },
        })
        expectStatus(postWithoutImages, 200, "allow posts without image attachments")
        const textPostId = extractId(postWithoutImages._data!.id)
        expect(textPostId).toBeDefined()
        postIds.push(textPostId!)

        const uploadsDisabled: AppSettings = {
            ...originalSettings,
            media: {
                ...originalSettings.media,
                images: {
                    ...originalSettings.media.images,
                    enabled: false,
                    attachments: { posts: true, threads: true },
                },
                gallery: { enabled: true },
            },
        }
        expectStatus(await updateSettings(uploadsDisabled), 200, "disable image uploads while leaving gallery publishing enabled")
        expectStatus(await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: { images: [imageRecord], title: "Uploads disabled", description: "", topics: [] },
        }), 403, "block gallery publishing when image uploads are disabled")
        expectStatus(await admin.fetchRaw("/api/post/add", {
            method: "POST",
            body: {
                title: `Disabled global image post ${marker}`,
                content: "The global image setting also blocks attachments.",
                topics: [],
                images: [imageRecord],
            },
        }), 403, "block post attachments when image uploads are disabled")
        expectStatus(await admin.fetchRaw("/api/thread/add", {
            method: "POST",
            body: {
                content: "The global image setting also blocks thread attachments.",
                topics: [],
                images: [imageRecord],
            },
        }), 403, "block thread attachments when image uploads are disabled")

        const savedGallery = await admin.fetch<Gallery>(`/api/gallery/${galleryId}`)
        expect(savedGallery.images.map(image => image.id)).toContain(imageRecord)
        const savedPost = await admin.fetch<Post>(`/api/post/${parentPostId}`)
        expect(savedPost.images.map(image => image.id)).toContain(imageRecord)
        const savedThread = await admin.fetch<Thread>(`/api/thread/${threadId}`)
        expect(savedThread.images.map(image => image.id)).toContain(imageRecord)
    }
    finally {
        try {
            expectStatus(await updateSettings(originalSettings), 200, "restore application settings")
        }
        finally {
            await admin.query([
                ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
                ...postIds.map(id => `DELETE post:${id};`),
                ...threadIds.map(id => `DELETE thread:${id};`),
                `DELETE image:${imageId};`,
                `DELETE mediaTrash:${imageId};`,
            ].join("\n"))
        }
    }
})
