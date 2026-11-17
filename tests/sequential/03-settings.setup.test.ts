import { beforeAll, expect, it } from "vitest"
import type { AppSettings, FeedPage, Link, Sortable } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expectStatus, grabUser } from "../utils/test-server"

const admin = await grabUser("admin")
let originalSettings: AppSettings
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

beforeAll(async () => {
    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    const response = await admin.fetchRaw(
        `/api/admin/settings/${extractId(settings.id)}/update`,
        {
            method: "POST",
            body: {
                ...settings,
                feeds: { ...settings.feeds, links: true },
                links: { ...settings.links, enabled: true },
            },
        },
    )
    expectStatus(response, 200, "enable Link settings for tests")
    originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
})

async function setLinksEnabled(enabled: boolean) {
    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    const response = await admin.fetchRaw(
        `/api/admin/settings/${extractId(settings.id)}/update`,
        {
            method: "POST",
            body: { ...settings, links: { ...settings.links, enabled } },
        },
    )
    expectStatus(response, 200, "update link publishing setting")
}

async function setLinkFeedEnabled(enabled: boolean) {
    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    const response = await admin.fetchRaw(
        `/api/admin/settings/${extractId(settings.id)}/update`,
        {
            method: "POST",
            body: { ...settings, feeds: { ...settings.feeds, links: enabled } },
        },
    )
    expectStatus(response, 200, "update dedicated link feed setting")
}

it("enables Link publishing and its feed for test coverage", async () => {
    const settings = await admin.fetch<AppSettings>("/api/settings/default")
    expect(settings.links.enabled).toBe(true)
    expect(settings.feeds.links).toBe(true)
})

it("rejects publishing when link publishing is disabled", async () => {
    try {
        await setLinksEnabled(false)
        const response = await admin.fetchRaw("/api/link/add", {
            method: "POST",
            body: linkRequest(nextTopicId()),
        })
        expectStatus(response, 403)
    }
    finally {
        await setLinksEnabled(true)
    }
})

it("keeps links in existing feeds when the dedicated link feed is disabled", async () => {
    const topic = nextTopicId()
    const title = `Existing feed link ${Date.now()}`
    let linkId: string | undefined

    try {
        await admin.query(`CREATE ONLY ${topic};`)
        const response = await admin.fetchRaw<Link>("/api/link/add", {
            method: "POST",
            body: linkRequest(topic, title),
        })
        expectStatus(response, 200, "create link for feed visibility test")
        linkId = extractId(response._data!.id)

        await admin.query(`
            CREATE pin SET item = link:${linkId}, user = ${admin.user.id}, active = true;
            CREATE pin SET item = link:${linkId}, user = ${admin.user.id}, scope = "topic", topic = ${topic}, active = true;
        `)
        await setLinkFeedEnabled(false)
        const settings = await admin.fetch<AppSettings>("/api/settings/default")
        expect(settings.feeds.links).toBe(false)

        const userId = extractId(admin.user.id)
        const feedCandidates = await admin.query<Array<Array<{ sourceId: string }>>>(
            "SELECT sourceId FROM feed ORDER BY time DESC, sourceId ASC;",
        )
        const popularOffset = feedCandidates[0]?.findIndex(candidate => candidate.sourceId === `link:${linkId}`) ?? -1
        expect(popularOffset).toBeGreaterThanOrEqual(0)

        const [links, userFeed, topicFeed, popularFeed, appPins, topicPins] = await Promise.all([
            admin.fetch<FeedPage<Link>>("/api/link?sortBy=new"),
            admin.fetch<FeedPage<Sortable>>(`/api/user/${userId}/feed?sortBy=new`),
            admin.fetch<FeedPage<Sortable>>(`/api/topic/${extractId(topic)}/feed?sortBy=new`),
            admin.fetch<{ items: Array<{ id: string }> }>(`/api/feed/popular?sortBy=new&pageSize=1&offset=${popularOffset}`),
            admin.fetch<Array<{ item: { id: string } }>>("/api/feed/pinned"),
            admin.fetch<Array<{ item: { id: string } }>>(`/api/topic/${extractId(topic)}/pins`),
        ])

        expect(links.items.some(item => item.id === `link:${linkId}`)).toBe(true)
        expect(userFeed.items.some(item => item.id === `link:${linkId}`)).toBe(true)
        expect(topicFeed.items.some(item => item.id === `link:${linkId}`)).toBe(true)
        expect(popularFeed.items.some(item => item.id === `link:${linkId}`)).toBe(true)
        expect(appPins.some(pin => pin.item.id === `link:${linkId}`)).toBe(true)
        expect(topicPins.some(pin => pin.item.id === `link:${linkId}`)).toBe(true)
    }
    finally {
        try {
            const cleanup = [`DELETE ${topic};`]
            if (linkId) cleanup.unshift(`DELETE pin WHERE item = link:${linkId};`, `DELETE link:${linkId};`)
            await admin.query(cleanup.join("\n"))
        }
        finally {
            await setLinkFeedEnabled(originalSettings.feeds.links)
        }
    }
})
