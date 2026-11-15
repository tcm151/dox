import { expect, it } from "vitest"
import type { Link } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, fetch, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
let topicSequence = 0

function nextTopicId() {
    topicSequence += 1
    return `topic:linktest${Date.now()}${topicSequence}`
}

function linkRequest(topic: string, title = `Link publishing ${Date.now()}`) {
    return {
        title,
        url: "http://127.0.0.1/article",
        topics: [topic],
    }
}

it("creates and retrieves a link and applies topic cooldowns", async () => {
    const topic = nextTopicId()
    const createdIds: string[] = []
    await admin.query(`CREATE ${topic};`)

    try {
        const response = await admin.fetchRaw<Link>("/api/link/add", {
            method: "POST",
            body: linkRequest(topic),
        })
        expectStatus(response, 200, "create link")

        const link = response._data!
        createdIds.push(extractId(link.id))
        expect(link.id).toMatch(/^link:/)
        expect(link.title).toMatch(/^Link publishing /)
        expect(link.url).toBe("http://127.0.0.1/article")
        expect(link.preview).toEqual({})
        expect(link.topics).toContain(topic)
        expect(link.user).toBe(admin.user.id)

        const fetched = await admin.fetch<Link>(`/api/link/${extractId(link.id)}`)
        expect(fetched.id).toBe(link.id)
        expect(fetched.comments).toEqual([])

        const repeated = await admin.fetchRaw<Link>("/api/link/add", {
            method: "POST",
            body: linkRequest(topic),
        })
        if (repeated._data?.id) createdIds.push(extractId(repeated._data.id))
        expectStatus(repeated, 429, "same-topic cooldown")
    }
    finally {
        await admin.query([
            ...createdIds.map(id => `DELETE link:${id};`),
            `DELETE ${topic};`,
        ].join("\n"))
    }
})

it("rejects malformed URLs and links without topics", async () => {
    const invalidUrl = await admin.fetchRaw("/api/link/add", {
        method: "POST",
        body: { ...linkRequest(nextTopicId()), url: "ftp://example.com/article" },
    })
    expectStatus(invalidUrl, 400, "reject unsupported URL protocol")

    const missingTopics = await admin.fetchRaw("/api/link/add", {
        method: "POST",
        body: { ...linkRequest(nextTopicId()), topics: [] },
    })
    expectStatus(missingTopics, 400, "require at least one topic")
})

it("enforces Link title length boundaries", async () => {
    const topics = [nextTopicId(), nextTopicId()]
    const createdIds: string[] = []
    await admin.query(topics.map(topic => `CREATE ${topic};`).join("\n"))

    try {
        for (const [topic, title] of [[topics[0], "Four"], [topics[1], "L".repeat(128)]] as const) {
            const response = await admin.fetchRaw<Link>("/api/link/add", {
                method: "POST",
                body: linkRequest(topic, title),
            })
            if (response._data?.id) createdIds.push(extractId(response._data.id))
            expectStatus(response, 200, `accept title of ${title.length} characters`)
            expect(response._data?.title).toBe(title)
        }

        for (const title of ["abc", "L".repeat(129)]) {
            const response = await admin.fetchRaw("/api/link/add", {
                method: "POST",
                body: linkRequest(nextTopicId(), title),
            })
            expectStatus(response, 400, `reject title of ${title.length} characters`)
        }
    }
    finally {
        await admin.query([
            ...createdIds.map(id => `DELETE link:${id};`),
            ...topics.map(topic => `DELETE ${topic};`),
        ].join("\n"))
    }
})

it("enforces Link title length at the database boundary", async () => {
    const titles = ["Four", "L".repeat(128), "abc", "L".repeat(129)]
    const suffix = Date.now().toString(36)
    const records = titles.map((_, index) => `link:titleBoundary${suffix}${index}`)

    try {
        for (const index of [0, 1]) {
            await admin.query(`CREATE ONLY ${records[index]} SET user = ${admin.user.id}, title = "${titles[index]}", url = "https://example.invalid";`)
        }

        for (const index of [2, 3]) {
            await expect(admin.query(`CREATE ONLY ${records[index]} SET user = ${admin.user.id}, title = "${titles[index]}", url = "https://example.invalid";`)).rejects.toThrow()
        }
    }
    finally {
        await admin.query(`DELETE [${records.join(", ")}];`)
    }
})

it("requires authentication to publish a link", async () => {
    const response = await fetch("/api/link/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkRequest(nextTopicId())),
    })

    expectStatus(response, 401)
})