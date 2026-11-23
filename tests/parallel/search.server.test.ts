import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser, uniqueTestIp } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, FeedPage, Gallery, Post, SearchResult, Thread } from "../../shared/types"

const admin = await grabUser("admin")

it("prioritizes an exact title match over a partial body-only match", async () => {
    const identifier = randomUUID().replaceAll("-", "")
    const searchTerm = `priority ${identifier} phrase`
    let titlePostId: string | undefined
    let bodyPostId: string | undefined

    try {
        const titlePostResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Specific match ${searchTerm}`,
                content: "No matching words in this body.",
                topics: [],
                images: [],
            },
        })
        expectStatus(titlePostResponse, 200)
        const titlePost = titlePostResponse._data!
        titlePostId = extractId(titlePost.id)
        expect(titlePostId).toBeDefined()

        const bodyPostResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: "A body-only search match",
                content: `This body contains priority split ${identifier} phrase.`,
                topics: [],
                images: [],
            },
        })
        expectStatus(bodyPostResponse, 200)
        const bodyPost = bodyPostResponse._data!
        bodyPostId = extractId(bodyPost.id)
        expect(bodyPostId).toBeDefined()

        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(response, 200, await response.clone().text())
        const results = (await response.json() as FeedPage<SearchResult>).items
        const titleIndex = results.findIndex(item => item.id === `post:${titlePostId}`)
        expect(titleIndex).toBeGreaterThanOrEqual(0)
        expect(results[titleIndex]?.search.exact).toBe(true)
        const bodyIndex = results.findIndex(item => item.id === `post:${bodyPostId}`)
        if (bodyIndex >= 0) {
            expect(results[bodyIndex]?.search.exact).toBe(false)
            expect(bodyIndex).toBeGreaterThan(titleIndex)
        }
    }
    finally {
        const recordIds = [
            ...(titlePostId ? [`post:${titlePostId}`] : []),
            ...(bodyPostId ? [`post:${bodyPostId}`] : []),
        ]
        if (recordIds.length) await admin.query(`DELETE [${recordIds.join(", ")}];`)
    }
})

it("prioritizes a full exact phrase match over partial token matches", async () => {
    const identifier = randomUUID().replaceAll("-", "")
    const searchTerm = `velvet ${identifier} horizon`
    const imageId = `exactSearchImage${Date.now()}`
    const postTitle = `Exact phrase context ${identifier}`
    const partialPostTitle = `Partial search ${identifier}`
    const commentContent = `This comment contains ${searchTerm} as one complete phrase.`
    const partialPostContent = Array(12)
        .fill(`velvet split horizon ${identifier} with repeated matching terms.`)
        .join(" ")
    let postId: string | undefined
    let partialPostId: string | undefined
    let commentId: string | undefined

    try {
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { title: postTitle, content: "Comment search context.", topics: [], images: [] },
        })
        expectStatus(postResponse, 200)
        const post = postResponse._data!
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        commentId = `exactSearchComment${Date.now()}`
        await admin.query(`
            CREATE ONLY comment:${commentId} SET
                user = ${admin.user.id},
                context = post:${postId},
                content = "${commentContent}",
                replyTo = post:${postId};
        `)

        const partialPostResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: partialPostTitle,
                content: partialPostContent,
                topics: [],
                images: [],
            },
        })
        expectStatus(partialPostResponse, 200)
        const partialPost = partialPostResponse._data!
        partialPostId = extractId(partialPost.id)
        expect(partialPostId).toBeDefined()

        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(response, 200, await response.clone().text())
        const results = (await response.json() as FeedPage<SearchResult>).items
        expect(results[0]?.id).toBe(`comment:${commentId}`)
        expect(results[0]?.search.exact).toBe(true)

        const partialResult = results.find(item => item.id === `post:${partialPostId}`)
        if (partialResult) {
            expect(partialResult.search.exact).toBe(false)
            expect(results.indexOf(partialResult)).toBeGreaterThan(0)
        }
    }
    finally {
        const recordIds = [
            ...(commentId ? [`comment:${commentId}`] : []),
            ...(postId ? [`post:${postId}`] : []),
            ...(partialPostId ? [`post:${partialPostId}`] : []),
            `image:${imageId}`,
        ]
        await admin.query(`DELETE [${recordIds.join(", ")}];`)
    }
})

it("returns empty results for unmatched and empty search terms", async () => {
    for (const text of [`neverfound${randomUUID().replaceAll("-", "")}`, ""]) {
        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(text)}`)
        expectStatus(response, 200, await response.clone().text())
        expect((await response.json() as FeedPage<SearchResult>).items).toEqual([])
    }
})

it("filters search results by type, topic, author, and inclusive UTC date range", async () => {
    const identifier = randomUUID().replaceAll("-", "")
    const searchTerm = `searchfilters${identifier}`
    const commentSearchTerm = `searchfiltercomment${identifier}`
    const topicId = `search1${identifier.slice(0, 25)}`
    const postTitle = `Search filters ${identifier}`
    let postId: string | undefined
    let commentId: string | undefined

    try {
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: postTitle,
                content: `Unique search text ${searchTerm}`,
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expectStatus(postResponse, 200)
        postId = extractId(postResponse._data!.id)
        expect(postId).toBeDefined()

        const commentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: `post:${postId}`, replyTo: `post:${postId}`, content: commentSearchTerm },
        })
        expectStatus(commentResponse, 200)
        commentId = extractId(commentResponse._data!.id)
        expect(commentId).toBeDefined()

        const today = new Date().toISOString().slice(0, 10)
        const filters = new URLSearchParams({
            text: searchTerm,
            type: "post",
            topic: topicId,
            user: admin.user.name.toUpperCase(),
            from: today,
            to: today,
        })
        const response = await fetch(`/api/feed/search?${filters}`)
        expectStatus(response, 200, await response.clone().text())
        const results = (await response.json() as FeedPage<SearchResult>).items
        expect(results.map(item => item.id)).toEqual([`post:${postId}`])

        for (const filters of [
            new URLSearchParams({ text: searchTerm, type: "post" }),
            new URLSearchParams({ text: searchTerm, topic: topicId }),
            new URLSearchParams({ text: searchTerm, user: admin.user.name.toUpperCase() }),
            new URLSearchParams({ text: searchTerm, from: today, to: today }),
        ]) {
            const filteredResponse = await fetch(`/api/feed/search?${filters}`)
            expectStatus(filteredResponse, 200, await filteredResponse.clone().text())
            const filteredResults = (await filteredResponse.json() as FeedPage<SearchResult>).items
            expect(filteredResults.map(item => item.id)).toEqual([`post:${postId}`])
        }

        const commentFilters = new URLSearchParams({
            text: commentSearchTerm,
            type: "comment",
            topic: topicId,
        })
        const commentSearchResponse = await fetch(`/api/feed/search?${commentFilters}`)
        expectStatus(commentSearchResponse, 200, await commentSearchResponse.clone().text())
        const commentResults = (await commentSearchResponse.json() as FeedPage<SearchResult>).items
        expect(commentResults.map(item => item.id)).toEqual([`comment:${commentId}`])

        const wrongType = await fetch(`/api/feed/search?${new URLSearchParams({ text: searchTerm, type: "thread" })}`)
        expectStatus(wrongType, 200, await wrongType.clone().text())
        expect((await wrongType.json() as FeedPage<SearchResult>).items).toEqual([])

        const invalidType = await fetch(`/api/feed/search?${new URLSearchParams({ text: searchTerm, type: "video" })}`)
        expectStatus(invalidType, 400, await invalidType.clone().text())

        const invalidTopic = await fetch(`/api/feed/search?${new URLSearchParams({ text: searchTerm, topic: `${topicId}a` })}`)
        expectStatus(invalidTopic, 400, await invalidTopic.clone().text())

        const invalidDate = await fetch(`/api/feed/search?${new URLSearchParams({ text: searchTerm, from: "2026-02-31" })}`)
        expectStatus(invalidDate, 400, await invalidDate.clone().text())

        const reversedRange = await fetch(`/api/feed/search?${new URLSearchParams({ text: searchTerm, from: "2026-11-16", to: "2026-11-15" })}`)
        expectStatus(reversedRange, 400, await reversedRange.clone().text())
    }
    finally {
        if (commentId) {
            await admin.query(`DELETE notification WHERE context = comment:${commentId}; DELETE comment:${commentId};`)
        }
        if (postId) await admin.query(`DELETE post:${postId};`)
        await admin.query(`DELETE topic:${topicId};`)
    }
})

it("searches active links by title and description with combined filters and stable pages", async () => {
    const identifier = randomUUID().replaceAll("-", "")
    const searchTerm = `linksearch${identifier}`
    const topicId = `ls${identifier.replace(/\d/g, "a").slice(0, 10)}`
    const topic = `topic:${topicId}`
    const titleLinkId = `linkSearchTitle${identifier}`
    const descriptionLinkId = `linkSearchDescription${identifier}`
    const archivedLinkId = `linkSearchArchived${identifier}`
    const quarantinedLinkId = `linkSearchQuarantined${identifier}`
    const deletedLinkId = `linkSearchDeleted${identifier}`

    try {
        await admin.query(`
            CREATE ONLY ${topic};
            CREATE ONLY link:${titleLinkId} SET
                user = ${admin.user.id},
                title = "Title ${searchTerm}",
                description = "No description match",
                url = "https://example.invalid/title",
                topics = [${topic}];
            CREATE ONLY link:${descriptionLinkId} SET
                user = ${admin.user.id},
                title = "Description match",
                description = "Description ${searchTerm}",
                url = "https://example.invalid/description",
                topics = [${topic}];
            CREATE ONLY link:${archivedLinkId} SET
                user = ${admin.user.id},
                title = "Archived ${searchTerm}",
                url = "https://example.invalid/archived",
                status = "archived";
            CREATE ONLY link:${quarantinedLinkId} SET
                user = ${admin.user.id},
                title = "Quarantined ${searchTerm}",
                url = "https://example.invalid/quarantined",
                status = "quarantined";
            CREATE ONLY link:${deletedLinkId} SET
                user = ${admin.user.id},
                title = "Deleted ${searchTerm}",
                url = "https://example.invalid/deleted",
                status = "deleted";
        `)

        const today = new Date().toISOString().slice(0, 10)
        const filters = new URLSearchParams({
            text: searchTerm,
            type: "link",
            topic: topicId,
            user: admin.user.name.toUpperCase(),
            from: today,
            to: today,
            pageSize: "1",
        })
        const firstResponse = await fetch(`/api/feed/search?${filters}`)
        expectStatus(firstResponse, 200, await firstResponse.clone().text())
        const firstPage = await firstResponse.json() as FeedPage<SearchResult>
        expect(firstPage).toMatchObject({ pageSize: 1, offset: 0, more: true })

        const nextResponse = await fetch(`/api/feed/search?${filters}&offset=1`)
        expectStatus(nextResponse, 200, await nextResponse.clone().text())
        const nextPage = await nextResponse.json() as FeedPage<SearchResult>
        expect(nextPage).toMatchObject({ pageSize: 1, offset: 1, more: false })

        const results = [...firstPage.items, ...nextPage.items]
        const orderedResults = [...results].sort((left, right) =>
            Number(right.search.exact) - Number(left.search.exact)
                || right.search.score - left.search.score
                || new Date(right.time).getTime() - new Date(left.time).getTime()
                || left.id.localeCompare(right.id),
        )
        expect(results.map(item => item.id)).toEqual(orderedResults.map(item => item.id))
        expect(results.map(item => item.id)).toEqual(expect.arrayContaining([
            `link:${titleLinkId}`,
            `link:${descriptionLinkId}`,
        ]))
        expect(results.every(item => item.id.startsWith("link:") && item.search.exact)).toBe(true)
        expect(results.find(item => item.id === `link:${titleLinkId}`)).toMatchObject({
            title: `Title ${searchTerm}`,
            topics: [topic],
            user: { id: admin.user.id },
        })
        expect(results.find(item => item.id === `link:${descriptionLinkId}`)).toMatchObject({
            title: "Description match",
            description: `Description ${searchTerm}`,
            topics: [topic],
            user: { id: admin.user.id },
        })

        const repeatedResponse = await fetch(`/api/feed/search?${filters}`)
        expectStatus(repeatedResponse, 200, await repeatedResponse.clone().text())
        const repeatedPage = await repeatedResponse.json() as FeedPage<SearchResult>
        expect(repeatedPage.items.map(item => item.id)).toEqual(firstPage.items.map(item => item.id))
    }
    finally {
        await admin.query(`
            DELETE [
                link:${titleLinkId}, link:${descriptionLinkId}, link:${archivedLinkId},
                link:${quarantinedLinkId}, link:${deletedLinkId}
            ];
            DELETE ${topic};
        `)
    }
})

it("excludes links muted or blocked by their author or topic", async () => {
    const identifier = randomUUID().replaceAll("-", "").toLowerCase()
    const searchTerm = `linkfilter${identifier}`
    const username = `SearchFilter${identifier.slice(0, 12)}`
    const topicId = `searchfilter${identifier.slice(0, 12)}`
    const linkId = `searchFilter${identifier}`
    let accessToken: string | undefined
    let viewerId: string | undefined

    try {
        const registerResponse = await fetch("/api/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Forwarded-For": uniqueTestIp() },
            body: JSON.stringify({ username, email: `${username.toLowerCase()}@example.invalid`, password: "SearchFilterTest-password" }),
        })
        expectStatus(registerResponse, 200, "search filter viewer registration")
        accessToken = await registerResponse.text()

        const profileResponse = await fetch("/api/profile/authenticate", {
            headers: { Authorization: accessToken },
        })
        expectStatus(profileResponse, 200, "search filter viewer authentication")
        viewerId = extractId((await profileResponse.json() as { id: string }).id)
        expect(viewerId).toBeDefined()

        await admin.query(`
            CREATE ONLY topic:${topicId};
            CREATE ONLY link:${linkId} SET
                user = ${admin.user.id},
                title = "Filtered link ${searchTerm}",
                url = "https://example.invalid/filtered",
                topics = [topic:${topicId}],
                status = "active";
        `)

        const query = `/api/feed/search?text=${encodeURIComponent(searchTerm)}`
        const publicResponse = await fetch(query)
        expectStatus(publicResponse, 200, "public link search")
        expect((await publicResponse.json() as FeedPage<SearchResult>).items.map(item => item.id)).toEqual([`link:${linkId}`])

        for (const target of [admin.user.id, `topic:${topicId}`]) {
            for (const [action, removal] of [["mute", "unmute"], ["block", "unblock"]] as const) {
                const addFilter = await fetch(`/api/profile/filters/${action}`, {
                    method: "POST",
                    headers: { Authorization: accessToken, "Content-Type": "application/json" },
                    body: JSON.stringify({ target }),
                })
                expectStatus(addFilter, 200, `${action} ${target}`)

                const filteredResponse = await fetch(query, { headers: { Authorization: accessToken } })
                expectStatus(filteredResponse, 200, `${action} link search`)
                expect((await filteredResponse.json() as FeedPage<SearchResult>).items).toEqual([])

                const removeFilter = await fetch(`/api/profile/filters/${removal}`, {
                    method: "POST",
                    headers: { Authorization: accessToken, "Content-Type": "application/json" },
                    body: JSON.stringify({ target }),
                })
                expectStatus(removeFilter, 200, `${removal} ${target}`)
            }
        }
    }
    finally {
        if (accessToken) {
            for (const target of [admin.user.id, `topic:${topicId}`]) {
                for (const action of ["unmute", "unblock"] as const) {
                    await fetch(`/api/profile/filters/${action}`, {
                        method: "POST",
                        headers: { Authorization: accessToken, "Content-Type": "application/json" },
                        body: JSON.stringify({ target }),
                    })
                }
            }
        }
        await admin.query(`DELETE [link:${linkId}, topic:${topicId}];`)
        if (viewerId) {
            await admin.query(`
                DELETE session WHERE account IN (SELECT VALUE id FROM account WHERE user = user:${viewerId});
                DELETE account WHERE user = user:${viewerId};
                DELETE userSettings WHERE user = user:${viewerId};
                DELETE user:${viewerId};
            `)
        }
    }
})
