import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../test-server"
import type { Topic } from "../../shared/types"

const admin = await grabUser("admin")

it("loads a topic when a related post is missing", async () => {
    const topicId = `missingPost${Date.now()}`

    try {
        await admin.query(`CREATE ONLY topic:${topicId} SET posts = [post:missing], threads = [];`)

        const response = await fetch("/api/topic")
        expectStatus(response, 200)
        const topics = await response.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(true)
    }
    finally {
        await admin.query(`DELETE topic:${topicId};`)
    }
})