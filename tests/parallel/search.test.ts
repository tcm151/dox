import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../test-server"
import { extractId } from "../../shared/utils/records"
import type { Comment, Gallery, Post, SearchResult, Thread } from "../../shared/types"

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
    let commentId: string | undefined
    let galleryCommentId: string | undefined

    try {
        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { title: postTitle, content: "Search test content", topics: [], images: [] },
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
                description: galleryDescription,
                topics: [],
            },
        })
        expectStatus(publishResponse, 200)

        const galleriesResponse = await fetch("/api/gallery")
        expectStatus(galleriesResponse, 200, await galleriesResponse.clone().text())
        const galleries = await galleriesResponse.json() as Gallery[]
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
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

        const searchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(searchResponse, 200, await searchResponse.clone().text())
        const results = await searchResponse.json() as SearchResult[]
        const orderedResults = [...results].sort((left, right) =>
            Number(right.search.exact) - Number(left.search.exact)
                || right.search.score - left.search.score,
        )
        expect(results.map(item => item.id)).toEqual(orderedResults.map(item => item.id))
        expect(results.find(item => item.id === `post:${postId}`)).toMatchObject({
            title: postTitle,
            user: { id: admin.user.id },
            moderation: { locked: "item" },
        })
        expect(results.find(item => item.id === `thread:${threadId}`)).toMatchObject({
            content: threadContent,
            user: { id: admin.user.id },
            moderation: { locked: "item" },
        })
        expect(results.find(item => item.id === `gallery:${galleryId}`)).toMatchObject({
            description: galleryDescription,
            user: { id: admin.user.id },
            moderation: { slowed: 30 },
        })

        const commentSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expectStatus(commentSearchResponse, 200, await commentSearchResponse.clone().text())
        const commentResults = await commentSearchResponse.json() as SearchResult[]
        expect(commentResults.map(item => item.id)).toEqual([`comment:${commentId}`])
        expect(commentResults[0]).toMatchObject({
            content: commentContent,
            context: { id: `post:${postId}`, title: postTitle },
            moderation: { locked: "item" },
        })

        const galleryCommentSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(galleryCommentTerm)}`)
        expectStatus(galleryCommentSearchResponse, 200, await galleryCommentSearchResponse.clone().text())
        const galleryCommentResults = await galleryCommentSearchResponse.json() as SearchResult[]
        expect(galleryCommentResults.map(item => item.id)).toEqual([`comment:${galleryCommentId}`])
        expect(galleryCommentResults[0]).toMatchObject({
            content: galleryCommentContent,
            context: { id: `gallery:${galleryId}`, description: galleryDescription },
            moderation: { slowed: 15 },
        })

        await admin.query(`UPDATE post:${postId} SET status = "archived";`)
        const archivedCommentResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expectStatus(archivedCommentResponse, 200, await archivedCommentResponse.clone().text())
        expect(await archivedCommentResponse.json()).toEqual([])
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
        expect(await deletedCommentResponse.json()).toEqual([])

        await admin.query(`
            UPDATE post:${postId} SET status = "archived";
            UPDATE thread:${threadId} SET status = "archived";
            UPDATE gallery:${galleryId} SET status = "archived";
        `)

        const archivedSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(archivedSearchResponse, 200, await archivedSearchResponse.clone().text())
        const archivedResults = await archivedSearchResponse.json() as SearchResult[]
        expect(archivedResults).toEqual([])
    }
    finally {
        const commentIds = [
            ...(commentId ? [`comment:${commentId}`] : []),
            ...(galleryCommentId ? [`comment:${galleryCommentId}`] : []),
        ]
        if (commentIds.length) await admin.query(`DELETE [${commentIds.join(", ")}];`)

        const recordIds = [
            ...(postId ? [`post:${postId}`] : []),
            ...(threadId ? [`thread:${threadId}`] : []),
            ...(galleryId ? [`gallery:${galleryId}`] : []),
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
        const results = await response.json() as SearchResult[]
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
        const results = await response.json() as SearchResult[]
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

it("filters low-relevance matches while preserving exact phrase matches", async () => {
    const identifier = randomUUID().replaceAll("-", "")
    const searchTerm = `clearwater ${identifier} harbor`
    const exactContent = `${searchTerm}. ${"ordinary filler ".repeat(1200)}`
    const partialContent = `clearwater split ${identifier} split harbor. ${"ordinary filler ".repeat(1200)}`
    let exactPostId: string | undefined
    let partialPostId: string | undefined

    try {
        const exactResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { title: "Exact threshold fixture", content: exactContent, topics: [], images: [] },
        })
        expectStatus(exactResponse, 200)
        const exactPost = exactResponse._data!
        exactPostId = extractId(exactPost.id)
        expect(exactPostId).toBeDefined()

        const partialResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: { title: "Partial threshold fixture", content: partialContent, topics: [], images: [] },
        })
        expectStatus(partialResponse, 200)
        const partialPost = partialResponse._data!
        partialPostId = extractId(partialPost.id)
        expect(partialPostId).toBeDefined()

        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expectStatus(response, 200, await response.clone().text())
        const results = await response.json() as SearchResult[]
        const exactResult = results.find(item => item.id === `post:${exactPostId}`)
        expect(exactResult?.search.exact).toBe(true)
        expect(exactResult?.search.score).toBeLessThan(0.5)
        expect(results.some(item => item.id === `post:${partialPostId}`)).toBe(false)
    }
    finally {
        const recordIds = [
            ...(exactPostId ? [`post:${exactPostId}`] : []),
            ...(partialPostId ? [`post:${partialPostId}`] : []),
        ]
        if (recordIds.length) await admin.query(`DELETE [${recordIds.join(", ")}];`)
    }
})

it("returns empty results for unmatched and empty search terms", async () => {
    for (const text of [`neverfound${randomUUID().replaceAll("-", "")}`, ""]) {
        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(text)}`)
        expectStatus(response, 200, await response.clone().text())
        expect(await response.json()).toEqual([])
    }
})