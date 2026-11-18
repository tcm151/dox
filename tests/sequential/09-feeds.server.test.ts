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
        for (let index = 0; index < 6; index++) {
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
        await admin.query(`CREATE ONLY image:${imageId} SET user = ${admin.user.id}, type = "jpeg", origin = "https://example.invalid", tokens = 0;`)

        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: {
                images: [`image:${imageId}`],
                title: "Mixed feed gallery",
                description: "Created by the mixed-feed pagination test.",
                topics: [`topic:${topicId}`],
            },
        })
        expectStatus(publishResponse, 200)

        const galleryResponse = await fetch("/api/gallery")
        expectStatus(galleryResponse, 200)
        const galleryPage = await galleryResponse.json() as FeedPage<Gallery>
        const publishedGallery = galleryPage.items.find(gallery => gallery.images.some(image => image.id === `image:${imageId}`))
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
            LET $now = time::now();
            UPDATE post:${postIds[0]} SET visits = 10, votes.positive = [${admin.user.id}], time = $now;
            UPDATE post:${postIds[1]} SET visits = 100, votes.positive = [${admin.user.id}], time = $now - 2h;
            UPDATE post:${postIds[2]} SET visits = 500, votes.positive = [${admin.user.id}], time = $now - 6h;
            UPDATE post:${postIds[3]} SET visits = 80, votes.positive = [${admin.user.id}], time = $now - 1h;
            UPDATE post:${postIds[4]} SET visits = 200, votes.positive = [${admin.user.id}], time = $now - 30m;
            UPDATE post:${postIds[5]} SET visits = 1000, votes.positive = [${admin.user.id}], time = $now - 24h;
            UPDATE thread:${threadId} SET visits = 40, votes.positive = [${admin.user.id}], time = $now - 4h;
            UPDATE gallery:${galleryId} SET visits = 50, votes.positive = [${admin.user.id}], time = $now - 3h;
        `)

        const expectedSourceIdSet = new Set(expectedSourceIds)
        const expectedFirstSourceIdBySort = {
            new: `post:${postIds[0]}`,
            hot: `post:${postIds[4]}`,
            top: `post:${postIds[5]}`,
        }
        const sortOrders = {
            new: "time DESC, sourceId ASC",
            hot: "hot DESC, time DESC, sourceId ASC",
            top: "score DESC, time DESC, sourceId ASC",
        }
        const expectedOrders = new Map<"new" | "hot" | "top", string[]>()
        for (const sortBy of ["new", "hot", "top"] as const) {
            const expectedOrderResults = await admin.query<Array<Array<{ sourceId: string; time: string; score: number; hot: number }>>>(
                `SELECT sourceId, time, score, fn::sort_hot(score, time, time::now()) AS hot FROM feed WHERE sourceId IN [${expectedSourceIds.join(", ")}] ORDER BY ${sortOrders[sortBy]};`,
            )
            const expectedRows = expectedOrderResults[0] ?? []
            const expectedOrder = expectedRows.map(row => row.sourceId)
            expectedOrders.set(sortBy, expectedOrder)
            expect(expectedOrder[0], `${sortBy}: ${JSON.stringify(expectedRows)}`).toBe(expectedFirstSourceIdBySort[sortBy])

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
            expect(actualOrder[0]).toBe(expectedFirstSourceIdBySort[sortBy])
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
            expect(followingOrder[0]).toBe(expectedFirstSourceIdBySort[sortBy])
        }

        for (const sortBy of ["new", "hot", "top"] as const) {
            const topicOrder: string[] = []
            let offset = 0
            while (true) {
                const response = await fetch(`/api/topic/${topicId}/feed?sortBy=${sortBy}&pageSize=2&offset=${offset}`)
                expectStatus(response, 200, await response.clone().text())
                const page = await response.json() as FeedPage<Sortable>
                expect(page.pageSize).toBe(2)
                expect(page.offset).toBe(offset)
                expect(page.items.length).toBeLessThanOrEqual(2)
                expect(page.items.every(item => expectedSourceIdSet.has(item.id))).toBe(true)
                topicOrder.push(...page.items.map(item => item.id))
                expect(page.more).toBe(offset + 2 < expectedSourceIds.length)
                if (!page.more) break
                offset += 2
            }

            expect(topicOrder).toEqual(expectedOrders.get(sortBy))
            expect(new Set(topicOrder).size).toBe(expectedSourceIds.length)
        }

        const userOrder: string[] = []
        const seenUserIds = new Set<string>()
        const userId = extractId(admin.user.id)
        if (!userId) throw new Error("Admin user has no ID.")
        let userOffset = 0
        while (true) {
            const response = await fetch(`/api/user/${userId}/feed?sortBy=new&pageSize=2&offset=${userOffset}`)
            expectStatus(response, 200, await response.clone().text())
            const page = await response.json() as FeedPage<Sortable>
            expect(page.pageSize).toBe(2)
            expect(page.offset).toBe(userOffset)
            expect(page.items.length).toBeLessThanOrEqual(2)
            for (const item of page.items) {
                expect(seenUserIds.has(item.id)).toBe(false)
                seenUserIds.add(item.id)
                userOrder.push(item.id)
            }
            if (!page.more) break
            userOffset += 2
        }
        for (const id of expectedSourceIds) {
            expect(userOrder.filter(itemId => itemId === id)).toHaveLength(1)
        }

        const oversizedResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=9999")
        expectStatus(oversizedResponse, 200)
        const oversizedPage = await oversizedResponse.json() as FeedPage<Post<string[]>>
        expect(oversizedPage.pageSize).toBe(50)
        expect(oversizedPage.items.length).toBeLessThanOrEqual(oversizedPage.pageSize)

        const zeroSizeResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=0")
        expectStatus(zeroSizeResponse, 200)
        const zeroSizePage = await zeroSizeResponse.json() as FeedPage<Post<string[]>>
        expect(zeroSizePage.pageSize).toBe(1)

        const invalidSizeResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=invalid")
        expectStatus(invalidSizeResponse, 200)
        const invalidSizePage = await invalidSizeResponse.json() as FeedPage<Post<string[]>>
        expect(invalidSizePage.pageSize).toBe(20)

        const negativeOffsetResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=2&offset=-2")
        expectStatus(negativeOffsetResponse, 200)
        const negativeOffsetPage = await negativeOffsetResponse.json() as FeedPage<Post<string[]>>
        expect(negativeOffsetPage.offset).toBe(0)

        const invalidOffsetResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=2&offset=invalid")
        expectStatus(invalidOffsetResponse, 200)
        const invalidOffsetPage = await invalidOffsetResponse.json() as FeedPage<Post<string[]>>
        expect(invalidOffsetPage.offset).toBe(0)

        const maximumOffsetResponse = await fetch("/api/feed/popular?sortBy=new&pageSize=2&offset=999999999")
        expectStatus(maximumOffsetResponse, 200)
        const maximumOffsetPage = await maximumOffsetResponse.json() as FeedPage<Post<string[]>>
        expect(maximumOffsetPage.offset).toBe(5_000_000)

        const defaultPageResponse = await fetch("/api/feed/popular")
        expectStatus(defaultPageResponse, 200)
        const defaultPage = await defaultPageResponse.json() as FeedPage<Sortable>
        expect(defaultPage.pageSize).toBe(20)
        expect(defaultPage.offset).toBe(0)
        expect(defaultPage.items.length).toBeLessThanOrEqual(defaultPage.pageSize)

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
        expect(finalPage!.items.length).toBeGreaterThan(0)
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

