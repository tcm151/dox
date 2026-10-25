import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import type { Gallery, Post, SearchResult, Thread } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { fetch, grabUser } from "../test-server"

const admin = await grabUser("admin")

async function runAdminQuery(query: string) {
    const response = await fetch("/api/developer/database/query", {
        method: "POST",
        headers: {
            Authorization: admin.accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
    })
    expect(response.status, await response.clone().text()).toBe(200)
    return await response.json() as unknown[][]
}

it("searches posts, threads, galleries, and comments in global relevance order", async () => {
    const searchTerm = `pomegranate${randomUUID().replaceAll("-", "")}`
    const commentTerm = `cobalt${randomUUID().replaceAll("-", "")}`
    const imageId = `searchImage${Date.now()}`
    const postTitle = `Searchable post ${searchTerm}`
    const threadContent = `Searchable thread ${searchTerm}`
    const galleryDescription = `Searchable gallery ${searchTerm}`
    const commentContent = `Unique marker ${commentTerm}`
    let postId: string | undefined
    let threadId: string | undefined
    let galleryId: string | undefined
    let commentId: string | undefined

    try {
        const postResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: postTitle, content: "Search test content", topics: [], images: [] }),
        })
        expect(postResponse.status, await postResponse.clone().text()).toBe(200)
        const post = await postResponse.json() as Post
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        commentId = `searchComment${Date.now()}`
        await runAdminQuery(`
            CREATE ONLY comment:${commentId} SET
                user = ${admin.user.id},
                post = post:${postId},
                content = "${commentContent}",
                replyTo = post:${postId};
        `)

        const threadResponse = await fetch("/api/thread/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: threadContent, topics: [], images: [] }),
        })
        expect(threadResponse.status, await threadResponse.clone().text()).toBe(200)
        const thread = await threadResponse.json() as Thread
        threadId = extractId(thread.id)
        expect(threadId).toBeDefined()

        await runAdminQuery(`
            CREATE ONLY image:${imageId} SET
                user = ${admin.user.id},
                type = "jpeg",
                origin = "https://example.invalid",
                tokens = 0;
        `)
        const publishResponse = await fetch("/api/gallery/publish", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                images: [`image:${imageId}`],
                description: galleryDescription,
                topics: [],
            }),
        })
        expect(publishResponse.status, await publishResponse.clone().text()).toBe(200)

        const galleriesResponse = await fetch("/api/gallery")
        expect(galleriesResponse.status, await galleriesResponse.clone().text()).toBe(200)
        const galleries = await galleriesResponse.json() as Gallery[]
        const gallery = galleries.find(item => item.images.some(image => image.id === `image:${imageId}`))
        expect(gallery).toBeDefined()
        galleryId = extractId(gallery!.id)

        const searchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(searchResponse.status, await searchResponse.clone().text()).toBe(200)
        const results = await searchResponse.json() as SearchResult[]
        const orderedResults = [...results].sort((left, right) =>
            Number(right.search.exact) - Number(left.search.exact)
                || right.search.score - left.search.score,
        )
        expect(results.map(item => item.id)).toEqual(orderedResults.map(item => item.id))
        expect(results.find(item => item.id === `post:${postId}`)).toMatchObject({
            title: postTitle,
            user: { id: admin.user.id },
        })
        expect(results.find(item => item.id === `thread:${threadId}`)).toMatchObject({
            content: threadContent,
            user: { id: admin.user.id },
        })
        expect(results.find(item => item.id === `gallery:${galleryId}`)).toMatchObject({
            description: galleryDescription,
            user: { id: admin.user.id },
        })

        const commentSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expect(commentSearchResponse.status, await commentSearchResponse.clone().text()).toBe(200)
        const commentResults = await commentSearchResponse.json() as SearchResult[]
        expect(commentResults.map(item => item.id)).toEqual([`comment:${commentId}`])
        expect(commentResults[0]).toMatchObject({
            content: commentContent,
            post: { id: `post:${postId}`, title: postTitle },
        })

        await runAdminQuery(`UPDATE post:${postId} SET archived = true;`)
        const archivedCommentResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expect(archivedCommentResponse.status, await archivedCommentResponse.clone().text()).toBe(200)
        expect(await archivedCommentResponse.json()).toEqual([])
        await runAdminQuery(`UPDATE post:${postId} SET archived = false;`)

        await runAdminQuery(`UPDATE comment:${commentId} SET deleted = true;`)
        const deletedCommentState = await runAdminQuery(`
            SELECT id, deleted FROM comment WHERE id = comment:${commentId};
        `)
        expect(deletedCommentState[0]).toMatchObject([{
            id: `comment:${commentId}`,
            deleted: true,
        }])
        const deletedCommentResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(commentTerm)}`)
        expect(deletedCommentResponse.status, await deletedCommentResponse.clone().text()).toBe(200)
        expect(await deletedCommentResponse.json()).toEqual([])

        await runAdminQuery(`
            UPDATE post:${postId} SET archived = true;
            UPDATE thread:${threadId} SET archived = true;
            UPDATE gallery:${galleryId} SET archived = true;
        `)

        const archivedSearchResponse = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(archivedSearchResponse.status, await archivedSearchResponse.clone().text()).toBe(200)
        const archivedResults = await archivedSearchResponse.json() as SearchResult[]
        expect(archivedResults).toEqual([])
    }
    finally {
        await runAdminQuery([
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            ...(postId ? [`DELETE post:${postId};`] : []),
            ...(threadId ? [`DELETE thread:${threadId};`] : []),
            ...(galleryId ? [`DELETE gallery:${galleryId};`] : []),
            `DELETE image:${imageId};`,
        ].join("\n"))
    }
})

it("prioritizes an exact title match over a partial body-only match", async () => {
    const identifier = randomUUID().replaceAll("-", "")
    const searchTerm = `priority ${identifier} phrase`
    let titlePostId: string | undefined
    let bodyPostId: string | undefined

    try {
        const titlePostResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: `Specific match ${searchTerm}`,
                content: "No matching words in this body.",
                topics: [],
                images: [],
            }),
        })
        expect(titlePostResponse.status, await titlePostResponse.clone().text()).toBe(200)
        const titlePost = await titlePostResponse.json() as Post
        titlePostId = extractId(titlePost.id)
        expect(titlePostId).toBeDefined()

        const bodyPostResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "A body-only search match",
                content: `This body contains priority split ${identifier} phrase.`,
                topics: [],
                images: [],
            }),
        })
        expect(bodyPostResponse.status, await bodyPostResponse.clone().text()).toBe(200)
        const bodyPost = await bodyPostResponse.json() as Post
        bodyPostId = extractId(bodyPost.id)
        expect(bodyPostId).toBeDefined()

        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(response.status, await response.clone().text()).toBe(200)
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
        await runAdminQuery([
            ...(titlePostId ? [`DELETE post:${titlePostId};`] : []),
            ...(bodyPostId ? [`DELETE post:${bodyPostId};`] : []),
        ].join("\n"))
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
        const postResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: postTitle, content: "Comment search context.", topics: [], images: [] }),
        })
        expect(postResponse.status, await postResponse.clone().text()).toBe(200)
        const post = await postResponse.json() as Post
        postId = extractId(post.id)
        expect(postId).toBeDefined()

        commentId = `exactSearchComment${Date.now()}`
        await runAdminQuery(`
            CREATE ONLY comment:${commentId} SET
                user = ${admin.user.id},
                post = post:${postId},
                content = "${commentContent}",
                replyTo = post:${postId};
        `)

        const partialPostResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: partialPostTitle,
                content: partialPostContent,
                topics: [],
                images: [],
            }),
        })
        expect(partialPostResponse.status, await partialPostResponse.clone().text()).toBe(200)
        const partialPost = await partialPostResponse.json() as Post
        partialPostId = extractId(partialPost.id)
        expect(partialPostId).toBeDefined()

        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(response.status, await response.clone().text()).toBe(200)
        const results = await response.json() as SearchResult[]
        expect(results[0]?.id).toBe(`comment:${commentId}`)
        expect(results[0]?.search.exact).toBe(true)

        expect(results.some(item => item.id === `post:${partialPostId}`)).toBe(false)
    }
    finally {
        await runAdminQuery([
            ...(commentId ? [`DELETE comment:${commentId};`] : []),
            ...(postId ? [`DELETE post:${postId};`] : []),
            ...(partialPostId ? [`DELETE post:${partialPostId};`] : []),
            `DELETE image:${imageId};`,
        ].join("\n"))
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
        const exactResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: "Exact threshold fixture", content: exactContent, topics: [], images: [] }),
        })
        expect(exactResponse.status, await exactResponse.clone().text()).toBe(200)
        const exactPost = await exactResponse.json() as Post
        exactPostId = extractId(exactPost.id)
        expect(exactPostId).toBeDefined()

        const partialResponse = await fetch("/api/post/add", {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: "Partial threshold fixture", content: partialContent, topics: [], images: [] }),
        })
        expect(partialResponse.status, await partialResponse.clone().text()).toBe(200)
        const partialPost = await partialResponse.json() as Post
        partialPostId = extractId(partialPost.id)
        expect(partialPostId).toBeDefined()

        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(searchTerm)}`)
        expect(response.status, await response.clone().text()).toBe(200)
        const results = await response.json() as SearchResult[]
        const exactResult = results.find(item => item.id === `post:${exactPostId}`)
        expect(exactResult?.search.exact).toBe(true)
        expect(exactResult?.search.score).toBeLessThan(0.5)
        expect(results.some(item => item.id === `post:${partialPostId}`)).toBe(false)
    }
    finally {
        await runAdminQuery([
            ...(exactPostId ? [`DELETE post:${exactPostId};`] : []),
            ...(partialPostId ? [`DELETE post:${partialPostId};`] : []),
        ].join("\n"))
    }
})

it("returns empty results for unmatched and empty search terms", async () => {
    for (const text of [`neverfound${randomUUID().replaceAll("-", "")}`, ""]) {
        const response = await fetch(`/api/feed/search?text=${encodeURIComponent(text)}`)
        expect(response.status, await response.clone().text()).toBe(200)
        expect(await response.json()).toEqual([])
    }
})