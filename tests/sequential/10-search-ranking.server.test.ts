import { randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { Post, SearchResult } from "../../shared/types"

const admin = await grabUser("admin")

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