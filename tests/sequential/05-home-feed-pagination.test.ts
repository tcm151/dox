import { expect, it } from "vitest"
import { fetch, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { FeedPage, Gallery, Post, Sortable, Thread } from "../../shared/types"

const admin = await grabUser("admin")

it("paginates popular feed results for each sort mode", async () => {
    const postIds: string[] = []
    let threadId: string | undefined
    let imageId: string | undefined
    let galleryId: string | undefined

    try {
        for (let index = 0; index < 4; index++) {
            const response = await fetch("/api/post/add", {
                method: "POST",
                headers: {
                    Authorization: admin.accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: `Feed pagination test ${Date.now()} ${index}`,
                    content: "Created by the isolated feed pagination test.",
                    topics: [],
                    images: [],
                }),
            })
            expect(response.status).toBe(200)
            const post = await response.json() as Post
            const postId = extractId(post.id)
            expect(postId).toBeDefined()
            postIds.push(postId!)
        }

        const threadResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: "Created by the isolated feed pagination test.",
                topics: [],
                images: [],
            }),
        })
        expect(threadResponse.status).toBe(200)
        const thread = await threadResponse.json() as Thread
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        imageId = `feedPagination${Date.now()}`
        const imageResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "image/jpeg", origin = "https://example.invalid", tokens = 0;`,
            }),
        })
        expect(imageResponse.status, await imageResponse.clone().text()).toBe(200)

        const publishResponse = await fetch("/api/gallery/publish", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                images: [`image:${imageId}`],
                description: "Created by the mixed-feed pagination test.",
                topics: [],
            }),
        })
        expect(publishResponse.status, await publishResponse.clone().text()).toBe(200)

        const galleryResponse = await fetch("/api/gallery")
        expect(galleryResponse.status).toBe(200)
        const galleries = await galleryResponse.json() as Gallery[]
        const publishedGallery = galleries.find(gallery => gallery.images.some(image => image.id === `image:${imageId}`))
        expect(publishedGallery).toBeDefined()
        galleryId = extractId(publishedGallery!.id)

        for (const sortBy of ["new", "hot", "top"]) {
            const firstResponse = await fetch(`/api/feed/popular?sortBy=${sortBy}&pageSize=2`)
            expect(firstResponse.status, await firstResponse.clone().text()).toBe(200)
            const firstPage = await firstResponse.json() as FeedPage<Post>
            expect(firstPage.items).toHaveLength(2)
            expect(firstPage.offset).toBe(0)
            expect(firstPage.more).toBe(true)

            const nextResponse = await fetch(`/api/feed/popular?sortBy=${sortBy}&pageSize=2&offset=${firstPage.offset + 2}`)
            expect(nextResponse.status).toBe(200)
            const nextPage = await nextResponse.json() as FeedPage<Post>
            expect(nextPage.offset).toBe(2)
            expect(nextPage.items.length).toBeLessThanOrEqual(2)
            expect(nextPage.more).toBe(nextPage.items.length === 2)
        }

        const oversizedResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=9999")
        expect(oversizedResponse.status).toBe(200)
        const oversizedPage = await oversizedResponse.json() as FeedPage<Post>
        expect(oversizedPage.items.length).toBeLessThanOrEqual(50)

        const negativeOffsetResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=2&offset=-2")
        expect(negativeOffsetResponse.status).toBe(200)
        const negativeOffsetPage = await negativeOffsetResponse.json() as FeedPage<Post>
        expect(negativeOffsetPage.offset).toBe(0)

        const defaultPageResponse = await fetch("/api/feed/popular")
        expect(defaultPageResponse.status).toBe(200)
        const defaultPage = await defaultPageResponse.json() as FeedPage<Sortable>
        expect(defaultPage.items.length).toBeLessThanOrEqual(20)

        const pagedIds: string[] = []
        let finalPage: FeedPage<Sortable> | undefined
        for (let offset = 0; ; offset += 2) {
            const response = await fetch(`/api/feed/popular?sortBy=new&pageSize=2&offset=${offset}`)
            expect(response.status).toBe(200)
            const page = await response.json() as FeedPage<Sortable>
            expect(page.items.length).toBeLessThanOrEqual(2)
            pagedIds.push(...page.items.map(item => item.id))
            if (!page.more) {
                finalPage = page
                break
            }
        }

        expect(finalPage).toBeDefined()
        expect(finalPage!.items).toHaveLength(2)
        expect(finalPage!.more).toBe(false)
        expect(new Set(pagedIds).size).toBe(pagedIds.length)
        expect(new Set(pagedIds.map(id => id.split(":")[0]))).toEqual(new Set(["post", "thread", "gallery"]))
        for (const id of [...postIds.map(id => `post:${id}`), `thread:${threadId}`, `gallery:${galleryId}`]) {
            expect(pagedIds.filter(pageId => pageId === id)).toHaveLength(1)
        }
    }
    finally {
        if (threadId) {
            const response = await fetch(`/api/thread/${threadId}/delete`, {
                headers: { Authorization: admin.accessToken },
            })
            expect(response.status).toBe(200)
        }
        if (imageId) {
            const response = await fetch("/api/developer/database/query", {
                method: "POST",
                headers: {
                    Authorization: admin.accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: `DELETE gallery WHERE images CONTAINS image:${imageId}; DELETE image:${imageId};` }),
            })
            expect(response.status).toBe(200)
        }
        for (const id of postIds) {
            const response = await fetch(`/api/post/${id}/delete`, {
                headers: { Authorization: admin.accessToken },
            })
            expect(response.status).toBe(200)
        }
    }
})
