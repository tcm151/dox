import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser, uniqueTestIp } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, FeedPage, Gallery, Post, SearchResult, Thread } from "../../shared/types"

const admin = await grabUser("admin")

it("searches posts, threads, galleries, and comments in global relevance order", async () => {
    const searchTerm = `pomegranate${randomUUID().replaceAll("-", "")}`
    const commentTerm = `cobalt${randomUUID().replaceAll("-", "")}`
    const galleryCommentTerm = `amber${randomUUID().replaceAll("-", "")}`
    const imageId = `searchImage${Date.now()}`
    const postTitle = `Searchable post ${searchTerm}`
    const threadContent = `Searchable thread ${searchTerm}`
    const galleryDescription = `Searchable gallery ${searchTerm}`
    const commentContent = `Unique marker ${commentTerm}`
    const galleryCommentContent = `Unique gallery marker ${galleryCommentTerm}`
    let postId: string | undefined
    let threadId: string | undefined
    let galleryId: string | undefined
    let linkId: string | undefined
    let commentId: string | undefined
    let galleryCommentId: string | undefined

    try {
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { title: postTitle, content: "Search test content", topics: [], images: [], tags: ["spoiler"] },
        })
        expectStatus(postResponse, 200)
        const post = postResponse._data!
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        commentId = `searchComment${Date.now()}`
        await admin.query(`
            CREATE ONLY comment:${commentId} SET
                user = ${admin.user.id},
                context = post:${postId},
                content = "${commentContent}",
                replyTo = post:${postId};
        `)

        const threadResponse = await admin.fetchRaw<Thread>("/api/thread/add", {
            method: "POST",
            body: { content: threadContent, topics: [], images: [] },
        })
        expectStatus(threadResponse, 200)
        const thread = threadResponse._data!
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        linkId = `searchLink${Date.now()}`
        await admin.query(`
            CREATE ONLY link:${linkId} SET
                user = ${admin.user.id},
                title = "Searchable link ${searchTerm}",
                description = "Link description",
                url = "https://example.invalid/search";
            LET $sharedTime = time::now();
            UPDATE post:${postId} SET time = $sharedTime;
            UPDATE link:${linkId} SET time = $sharedTime;
        `)

        await admin.query(`
            CREATE ONLY image:${imageId} SET
                user = ${admin.user.id},
                type = "jpeg",
                origin = "https://example.invalid",
                tokens = 0;
        `)
        const publishResponse = await admin.fetchRaw("/api/gallery/publish", {
            method: "POST",
            body: {
                images: [`image:${imageId}`],
                title: `Search gallery ${searchTerm}`,
                description: galleryDescription,
                topics: [],
            },
        })
        expectStatus(publishResponse, 200)

        const galleriesResponse = await fetch("/api/gallery")
        expectStatus(galleriesResponse, 200, await galleriesResponse.clone().text())
        const galleries = await galleriesResponse.json() as FeedPage<Gallery>
        const gallery = galleries.items.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const galleryCommentResponse = await admin.fetchRaw<Comment>("/api/comment/add", {
            method: "POST",
            body: { context: gallery!.id, replyTo: gallery!.id, content: galleryCommentContent },
        })
        expectStatus(galleryCommentResponse, 200)
        galleryCommentId = extractId(galleryCommentResponse._data!.id)

        await admin.query(`
            CREATE moderation SET subject = post:${postId}, locked = "item";
            CREATE moderation SET subject = thread:${threadId}, locked = "item";
            CREATE moderation SET subject = gallery:${galleryId}, slowed = 30;
            CREATE moderation SET subject = comment:${commentId}, locked = "item";
            CREATE moderation SET subject = comment:${galleryCommentId}, slowed = 15;
        `)

        const searchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}&pageSize=2`)
        expectStatus(searchResponse, 200, await searchResponse.clone().text())
        const firstPage = await searchResponse.json() as FeedPage<SearchResult>
        expect(firstPage).toMatchObject({ pageSize: 2, offset: 0, more: true })
        const nextResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}&pageSize=2&offset=2`)
        expectStatus(nextResponse, 200, await nextResponse.clone().text())
        const nextPage = await nextResponse.json() as FeedPage<SearchResult>
        expect(nextPage).toMatchObject({ pageSize: 2, offset: 2, more: false })
        const results = [...firstPage.items, ...nextPage.items]
        const orderedResults = [...results].sort((left, right) =>
            Number(right.search.exact) - Number(left.search.exact)
                || right.search.score - left.search.score
                || new Date(right.time).getTime() - new Date(left.time).getTime()
                || left.id.localeCompare(right.id),
        )
        expect(results.map(item => item.id)).toEqual(orderedResults.map(item => item.id))
        const postResult = results.find(item => item.id === `post:${postId}`)
        expect(postResult).toMatchObject({
            title: postTitle,
            user: { id: admin.user.id },
            moderation: { locked: "item" },
        })
        expect(postResult?.user).toEqual({
            id: admin.user.id,
            name: admin.user.name,
            roles: admin.user.roles,
        })
        const linkResult = results.find(item => item.id === `link:${linkId}`)
        expect(linkResult).toBeDefined()
        expect(linkResult!.search.exact).toBe(true)
        expect(linkResult!.time).toBe(postResult!.time)
        expect(results.find(item => item.id === `thread:${threadId}`)).toMatchObject({
            content: threadContent,
            user: { id: admin.user.id },
            moderation: { locked: "item" },
        })
        expect(results.find(item => item.id === `link:${linkId}`)).toMatchObject({
            title: `Searchable link ${searchTerm}`,
            description: "Link description",
            url: "https://example.invalid/search",
            user: { id: admin.user.id },
        })
        expect(results.find(item => item.id === `gallery:${galleryId}`)).toMatchObject({
            description: galleryDescription,
            user: { id: admin.user.id },
            moderation: { slowed: 30 },
        })

        const commentSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expectStatus(commentSearchResponse, 200, await commentSearchResponse.clone().text())
        const commentResults = (await commentSearchResponse.json() as FeedPage<SearchResult>).items
        expect(commentResults.map(item => item.id)).toEqual([`comment:${commentId}`])
        expect(commentResults[0]).toMatchObject({
            content: commentContent,
            context: { id: `post:${postId}`, title: postTitle, tags: ["spoiler"] },
            moderation: { locked: "item" },
        })

        const galleryCommentSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(galleryCommentTerm)}`)
        expectStatus(galleryCommentSearchResponse, 200, await galleryCommentSearchResponse.clone().text())
        const galleryCommentResults = (await galleryCommentSearchResponse.json() as FeedPage<SearchResult>).items
        expect(galleryCommentResults.map(item => item.id)).toEqual([`comment:${galleryCommentId}`])
        expect(galleryCommentResults[0]).toMatchObject({
            content: galleryCommentContent,
            context: { id: `gallery:${galleryId}`, description: galleryDescription },
            moderation: { slowed: 15 },
        })

        await admin.query(`UPDATE post:${postId} SET status = "archived";`)
        const archivedCommentResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expectStatus(archivedCommentResponse, 200, await archivedCommentResponse.clone().text())
        expect((await archivedCommentResponse.json() as FeedPage<SearchResult>).items).toEqual([])
        await admin.query(`UPDATE post:${postId} SET status = "active";`)

        await admin.query(`UPDATE comment:${commentId} SET deleted = true;`)
        const deletedCommentState = await admin.query<unknown[][]>(`
            SELECT id, deleted FROM comment WHERE id = comment:${commentId};
        `)
        expect(deletedCommentState[0]).toMatchObject([{
            id: `comment:${commentId}`,
            deleted: true,
        }])
        const deletedCommentResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expectStatus(deletedCommentResponse, 200, await deletedCommentResponse.clone().text())
        expect((await deletedCommentResponse.json() as FeedPage<SearchResult>).items).toEqual([])

        await admin.query(`
            UPDATE post:${postId} SET status = "archived";
            UPDATE thread:${threadId} SET status = "archived";
            UPDATE gallery:${galleryId} SET status = "archived";
            UPDATE link:${linkId} SET status = "archived";
        `)

        const archivedSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(archivedSearchResponse, 200, await archivedSearchResponse.clone().text())
        const archivedResults = await archivedSearchResponse.json() as FeedPage<SearchResult>
        expect(archivedResults.items).toEqual([])
    }
    finally {
        const commentIds = [
            ...(commentId ? [`comment:${commentId}`] : []),
            ...(galleryCommentId ? [`comment:${galleryCommentId}`] : []),
        ]
        if (commentIds.length) {
            await admin.query(`DELETE notification WHERE context IN [${commentIds.join(", ")}]; DELETE [${commentIds.join(", ")}];`)
        }

        const recordIds = [
            ...(postId ? [`post:${postId}`] : []),
            ...(threadId ? [`thread:${threadId}`] : []),
            ...(galleryId ? [`gallery:${galleryId}`] : []),
            ...(linkId ? [`link:${linkId}`] : []),
            `image:${imageId}`,
        ]
        const moderationSubjectIds = [
            ...(postId ? [`post:${postId}`] : []),
            ...(threadId ? [`thread:${threadId}`] : []),
            ...(galleryId ? [`gallery:${galleryId}`] : []),
            ...commentIds,
        ]
        if (moderationSubjectIds.length) {
            await admin.query(`DELETE moderation WHERE subject IN [${moderationSubjectIds.join(", ")}];`)
        }
        await admin.query(`DELETE [${recordIds.join(", ")}];`)
        if (postId) await admin.query(`DELETE notification WHERE context = post:${postId};`)
        if (galleryId) await admin.query(`DELETE notification WHERE context = gallery:${galleryId};`)
    }
})

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
    const topicId = `search${identifier.replace(/\d/g, "a").slice(0, 12)}`
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
