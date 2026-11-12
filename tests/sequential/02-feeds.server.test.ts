import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { FeedPage, Gallery, Post, Sortable, Thread, Topic } from "../../shared/types"

const admin = await grabUser("admin")

it("paginates popular feed results for each sort mode", async () => {
    const postIds: string[] = []
    const sourceScores = new Map<string, number>()
    const topicId = `feedPagination${Date.now()}`
    let topicFollowed = false
    let threadId: string | undefined
    let imageId: string | undefined
    let galleryId: string | undefined

    try {
        for (let index = 0; index < 4; index++) {
            const response = await admin.fetchRaw<Post>("/api/post/add", {
                method: "POST",
                body: {
                    title: `Feed pagination test ${Date.now()} ${index}`,
                    content: "Created by the isolated feed pagination test.",
                    topics: [`topic:${topicId}`],
                    images: [],
                },
            })
            expectStatus(response, 200)
            const post = response._data!
            const postId = extractId(post.id)
            expect(postId).toBeDefined()
            expect(Number.isFinite(post.score)).toBe(true)
            postIds.push(postId!)
            sourceScores.set(`post:${postId}`, post.score)

            if (index === 0) {
                const topicPosts = await admin.query<Array<Array<string[]>>>(`SELECT VALUE posts FROM topic:${topicId};`)
                expect(topicPosts[0]?.[0]).toContain(`post:${postId}`)

                const topic = await admin.fetch<Topic>(`/api/topic/${topicId}`)
                const topicSettingsResponse = await admin.fetchRaw(`/api/topic/${topicId}/update`, {
                    method: "POST",
                    body: {
                        description: topic.description ?? "",
                        moderation: { ...topic.moderation, maxPostInterval: 0 },
                        rules: topic.rules ?? "",
                    },
                })
                expectStatus(topicSettingsResponse, 200, "disable feed fixture topic cooldown")
            }
        }

        const threadResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: {
                content: "Created by the isolated feed pagination test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(threadResponse, 200)
        const thread = threadResponse._data!
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()
        expect(Number.isFinite(thread.score)).toBe(true)
        sourceScores.set(`thread:${threadId}`, thread.score)

        imageId = `feedPagination${Date.now()}`
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "image/jpeg", origin = "https://example.invalid", tokens = 0;`)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: {
                images: [`image:${imageId}`],
                description: "Created by the mixed-feed pagination test.",
                topics: [`topic:${topicId}`],
            },
        })
        expectStatus(publishResponse, 200)

        const galleryResponse = await fetch("/api/gallery")
        expectStatus(galleryResponse, 200)
        const galleries = await galleryResponse.json() as Gallery[]
        const publishedGallery = galleries.find(gallery => gallery.images.some(image => image.id === `image:${imageId}`))
        expect(publishedGallery).toBeDefined()
        galleryId = extractId(publishedGallery!.id)
        expect(Number.isFinite(publishedGallery!.score)).toBe(true)
        sourceScores.set(`gallery:${galleryId}`, publishedGallery!.score)

        const followTopicResponse = await admin.fetchRaw(`/api/topic/${topicId}/follow`)
        expectStatus(followTopicResponse, 200)
        topicFollowed = true

        const expectedSourceIds = [
            ...postIds.map(id => `post:${id}`),
            `thread:${threadId}`,
            `gallery:${galleryId}`,
        ]
        const feedScores = await admin.query<Array<Array<{ sourceId: string; score: number }>>>(
            `SELECT sourceId, score FROM feed WHERE sourceId IN [${expectedSourceIds.join(", ")}];`,
        )
        const feedScoreRows = feedScores[0] ?? []
        expect(feedScoreRows.map(row => row.sourceId).sort()).toEqual([...expectedSourceIds].sort())
        for (const row of feedScoreRows) {
            expect(Number.isFinite(row.score)).toBe(true)
            expect(row.score).toBe(sourceScores.get(row.sourceId))
        }

        await admin.query(`
            LET $tieTime = time::now();
            UPDATE post:${postIds[0]} SET visits = 10, votes.positive = [${admin.user.id}], time = $tieTime;
            UPDATE post:${postIds[1]} SET visits = 10, votes.positive = [${admin.user.id}], time = $tieTime;
            UPDATE post:${postIds[2]} SET visits = 20, votes.positive = [${admin.user.id}];
            UPDATE post:${postIds[3]} SET visits = 30, votes.positive = [${admin.user.id}];
            UPDATE thread:${threadId} SET visits = 40, votes.positive = [${admin.user.id}];
            UPDATE gallery:${galleryId} SET visits = 50, votes.positive = [${admin.user.id}];
        `)

        const expectedSourceIdSet = new Set(expectedSourceIds)
        const sortOrders = {
            new: "time DESC, sourceId ASC",
            hot: "hot DESC, time DESC, sourceId ASC",
            top: "score DESC, time DESC, sourceId ASC",
        }
        const expectedOrders = new Map<"new" | "hot" | "top", string[]>()
        for (const sortBy of ["new", "hot", "top"] as const) {
            const expectedOrderResults = await admin.query<Array<Array<{ sourceId: string }>>>(
                `SELECT sourceId FROM feed WHERE sourceId IN [${expectedSourceIds.join(", ")}] ORDER BY ${sortOrders[sortBy]};`,
            )
            const expectedOrder = expectedOrderResults[0]?.map(row => row.sourceId) ?? []
            expectedOrders.set(sortBy, expectedOrder)

            const actualOrder: string[] = []
            for (let offset = 0; ; offset += 2) {
                const response = await fetch(`/api/feed/popular?sortBy=${sortBy}&pageSize=2&offset=${offset}`)
                expectStatus(response, 200, await response.clone().text())
                const page = await response.json() as FeedPage<Sortable>
                expect(page.offset).toBe(offset)
                expect(page.items.length).toBeLessThanOrEqual(2)
                actualOrder.push(...page.items.map(item => item.id).filter(id => expectedSourceIdSet.has(id)))
                if (!page.more) break
            }

            expect(actualOrder).toEqual(expectedOrder)
        }

        for (const sortBy of ["new", "hot", "top"] as const) {
            const followingOrder: string[] = []
            for (let offset = 0; offset < expectedSourceIds.length; offset += 2) {
                const page = await admin.fetch<FeedPage<Post | Thread | Gallery>>(`/api/feed/following?sortBy=${sortBy}&pageSize=2&offset=${offset}`)
                expect(page.offset).toBe(offset)
                expect(page.items.length).toBeLessThanOrEqual(2)
                expect(page.items.every(item => expectedSourceIdSet.has(item.id))).toBe(true)
                expect(page.items.every(item => item.topics.includes(`topic:${topicId}`))).toBe(true)
                followingOrder.push(...page.items.map(item => item.id))
                expect(page.more).toBe(offset + 2 < expectedSourceIds.length)
            }
            expect(followingOrder).toEqual(expectedOrders.get(sortBy))
        }

        const oversizedResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=9999")
        expectStatus(oversizedResponse, 200)
        const oversizedPage = await oversizedResponse.json() as FeedPage<Post>
        expect(oversizedPage.items.length).toBeLessThanOrEqual(50)

        const negativeOffsetResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=2&offset=-2")
        expectStatus(negativeOffsetResponse, 200)
        const negativeOffsetPage = await negativeOffsetResponse.json() as FeedPage<Post>
        expect(negativeOffsetPage.offset).toBe(0)

        const defaultPageResponse = await fetch("/api/feed/popular")
        expectStatus(defaultPageResponse, 200)
        const defaultPage = await defaultPageResponse.json() as FeedPage<Sortable>
        expect(defaultPage.items.length).toBeLessThanOrEqual(20)

        const pagedIds: string[] = []
        let finalPage: FeedPage<Sortable> | undefined
        for (let offset = 0; ; offset += 2) {
            const response = await fetch(`/api/feed/popular?sortBy=new&pageSize=2&offset=${offset}`)
            expectStatus(response, 200)
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
        if (topicFollowed) {
            const response = await admin.fetchRaw(`/api/topic/${topicId}/unfollow`)
            expectStatus(response, 200)
        }
        if (threadId) {
            const response = await admin.fetchRaw(`/api/thread/${threadId}/delete`)
            expectStatus(response, 200)
        }
        if (imageId) {
            await admin.query(`DELETE gallery WHERE images CONTAINS image:${imageId}; DELETE image:${imageId};`)
        }
        for (const id of postIds) {
            const response = await admin.fetchRaw(`/api/post/${id}/delete`)
            expectStatus(response, 200)
        }
        await admin.query(`DELETE topic:${topicId};`)
    }
})
