import { expect, it } from "vitest"
import { fetch, grabUser } from "../test-server"
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
            const response = await fetch("/api/post/add", {
                method: "POST",
                headers: {
                    Authorization: admin.accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: `Feed pagination test ${Date.now()} ${index}`,
                    content: "Created by the isolated feed pagination test.",
                    topics: [`topic:${topicId}`],
                    images: [],
                }),
            })
            expect(response.status).toBe(200)
            const post = await response.json() as Post
            const postId = extractId(post.id)
            expect(postId).toBeDefined()
            expect(Number.isFinite(post.score)).toBe(true)
            postIds.push(postId!)
            sourceScores.set(`post:${postId}`, post.score)

            if (index === 0) {
                const topicPostsResponse = await fetch("/api/developer/database/query", {
                    method: "POST",
                    headers: {
                        Authorization: admin.accessToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ query: `SELECT VALUE posts FROM topic:${topicId};` }),
                })
                expect(topicPostsResponse.status, await topicPostsResponse.clone().text()).toBe(200)
                const topicPosts = await topicPostsResponse.json() as Array<Array<string[]>>
                expect(topicPosts[0]?.[0]).toContain(`post:${postId}`)
            }
        }

        const threadResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: "Created by the isolated feed pagination test.",
                topics: [`topic:${topicId}`],
                images: [],
            }),
        })
        expect(threadResponse.status).toBe(200)
        const thread = await threadResponse.json() as Thread
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()
        expect(Number.isFinite(thread.score)).toBe(true)
        sourceScores.set(`thread:${threadId}`, thread.score)

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
                topics: [`topic:${topicId}`],
            }),
        })
        expect(publishResponse.status, await publishResponse.clone().text()).toBe(200)

        const galleryResponse = await fetch("/api/gallery")
        expect(galleryResponse.status).toBe(200)
        const galleries = await galleryResponse.json() as Gallery[]
        const publishedGallery = galleries.find(gallery => gallery.images.some(image => image.id === `image:${imageId}`))
        expect(publishedGallery).toBeDefined()
        galleryId = extractId(publishedGallery!.id)
        expect(Number.isFinite(publishedGallery!.score)).toBe(true)
        sourceScores.set(`gallery:${galleryId}`, publishedGallery!.score)

        const followTopicResponse = await fetch(`/api/topic/${topicId}/follow`, {
            headers: { Authorization: admin.accessToken },
        })
        expect(followTopicResponse.status, await followTopicResponse.clone().text()).toBe(200)
        topicFollowed = true

        const expectedSourceIds = [
            ...postIds.map(id => `post:${id}`),
            `thread:${threadId}`,
            `gallery:${galleryId}`,
        ]
        const feedScoresResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `SELECT sourceId, score FROM feed WHERE sourceId IN [${expectedSourceIds.join(", ")}];`,
            }),
        })
        expect(feedScoresResponse.status, await feedScoresResponse.clone().text()).toBe(200)
        const feedScores = await feedScoresResponse.json() as Array<Array<{ sourceId: string; score: number }>>
        const feedScoreRows = feedScores[0] ?? []
        expect(feedScoreRows.map(row => row.sourceId).sort()).toEqual([...expectedSourceIds].sort())
        for (const row of feedScoreRows) {
            expect(Number.isFinite(row.score)).toBe(true)
            expect(row.score).toBe(sourceScores.get(row.sourceId))
        }

        const scoreSetupResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `
                    LET $tieTime = time::now();
                    UPDATE post:${postIds[0]} SET visits = 10, votes.positive = [${admin.user.id}], time = $tieTime;
                    UPDATE post:${postIds[1]} SET visits = 10, votes.positive = [${admin.user.id}], time = $tieTime;
                    UPDATE post:${postIds[2]} SET visits = 20, votes.positive = [${admin.user.id}];
                    UPDATE post:${postIds[3]} SET visits = 30, votes.positive = [${admin.user.id}];
                    UPDATE thread:${threadId} SET visits = 40, votes.positive = [${admin.user.id}];
                    UPDATE gallery:${galleryId} SET visits = 50, votes.positive = [${admin.user.id}];
                `,
            }),
        })
        expect(scoreSetupResponse.status, await scoreSetupResponse.clone().text()).toBe(200)

        const fixtureIds = new Set(expectedSourceIds)
        const sortOrders = {
            new: "time DESC, sourceId ASC",
            hot: "hot DESC, time DESC, sourceId ASC",
            top: "score DESC, time DESC, sourceId ASC",
        }
        const expectedOrders = new Map<"new" | "hot" | "top", string[]>()
        for (const sortBy of ["new", "hot", "top"] as const) {
            const expectedOrderResponse = await fetch("/api/developer/database/query", {
                method: "POST",
                headers: {
                    Authorization: admin.accessToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: `SELECT sourceId FROM feed WHERE sourceId IN [${expectedSourceIds.join(", ")}] ORDER BY ${sortOrders[sortBy]};`,
                }),
            })
            expect(expectedOrderResponse.status, await expectedOrderResponse.clone().text()).toBe(200)
            const expectedOrderResults = await expectedOrderResponse.json() as Array<Array<{ sourceId: string }>>
            const expectedOrder = expectedOrderResults[0]?.map(row => row.sourceId) ?? []
            expectedOrders.set(sortBy, expectedOrder)

            const actualOrder: string[] = []
            for (let offset = 0; ; offset += 2) {
                const response = await fetch(`/api/feed/popular?sortBy=${sortBy}&pageSize=2&offset=${offset}`)
                expect(response.status, await response.clone().text()).toBe(200)
                const page = await response.json() as FeedPage<Sortable>
                expect(page.offset).toBe(offset)
                expect(page.items.length).toBeLessThanOrEqual(2)
                actualOrder.push(...page.items.map(item => item.id).filter(id => fixtureIds.has(id)))
                if (!page.more) break
            }

            expect(actualOrder).toEqual(expectedOrder)
        }

        const followingOrder: string[] = []
        for (let offset = 0; offset < expectedSourceIds.length; offset += 2) {
            const response = await fetch(`/api/feed/following?sortBy=new&pageSize=2&offset=${offset}`, {
                headers: { Authorization: admin.accessToken },
            })
            expect(response.status, await response.clone().text()).toBe(200)
            const page = await response.json() as FeedPage<Post | Thread | Gallery>
            expect(page.offset).toBe(offset)
            expect(page.items.length).toBeLessThanOrEqual(2)
            expect(page.items.every(item => fixtureIds.has(item.id))).toBe(true)
            expect(page.items.every(item => item.topics.includes(`topic:${topicId}`))).toBe(true)
            followingOrder.push(...page.items.map(item => item.id))
            expect(page.more).toBe(offset + 2 < expectedSourceIds.length)
        }
        expect(followingOrder).toEqual(expectedOrders.get("new"))

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
        if (topicFollowed) {
            const response = await fetch(`/api/topic/${topicId}/unfollow`, {
                headers: { Authorization: admin.accessToken },
            })
            expect(response.status).toBe(200)
        }
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
        const topicCleanupResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: `DELETE topic:${topicId};` }),
        })
        expect(topicCleanupResponse.status).toBe(200)
    }
})
