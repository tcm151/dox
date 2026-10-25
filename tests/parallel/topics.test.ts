import { expect, it } from "vitest"
import { fetch, testAdminCredentials } from "../test-server"
import type { Topic } from "../../shared/types"

type LoginResponse = {
    tokens: { access: string }
}

it("loads a topic when a related post is missing", async () => {
    const loginResponse = await fetch("/api/profile/login", {
        headers: {
            Authorization: btoa(`${testAdminCredentials.name}:${testAdminCredentials.password}`),
        },
    })
    expect(loginResponse.status).toBe(200)
    const admin = await loginResponse.json() as LoginResponse
    const topicId = `missingPost${Date.now()}`

    try {
        const createResponse = await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.tokens.access,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `CREATE ONLY topic:${topicId} SET posts = [post:missing], threads = [];`,
            }),
        })
        expect(createResponse.status, await createResponse.clone().text()).toBe(200)

        const response = await fetch("/api/topic")
        expect(response.status).toBe(200)
        const topics = await response.json() as Topic[]
        expect(topics.some(topic => topic.id === `topic:${topicId}`)).toBe(true)
    }
    finally {
        await fetch("/api/developer/database/query", {
            method: "POST",
            headers: {
                Authorization: admin.tokens.access,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: `DELETE topic:${topicId};` }),
        })
    }
})