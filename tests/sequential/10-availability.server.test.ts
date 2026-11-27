import { expect, it } from "vitest"
import { expectStatus, fetch, grabUser } from "../utils/test-server"
import { extractId } from "../../shared/utils/records"
import type { AppSettings, FeedPage, Post, Sortable } from "../../shared/types"

const admin = await grabUser("admin")

it("enforces dedicated feed availability without blocking shared or aggregate reads", async () => {
    const originalSettings = await admin.fetch<AppSettings>("/api/settings/default")
    const settingsId = extractId(originalSettings.id)
    if (!settingsId) throw new Error("App settings record has no ID.")

    const updateFeeds = (feeds: AppSettings["feeds"]) => admin.fetchRaw(
        `/api/admin/settings/${settingsId}/update`,
        { method: "POST", body: { ...originalSettings, feeds } },
    )
    const feedCases: { setting: keyof AppSettings["feeds"], route: string, apis: string[] }[] = [
        { setting: "discover", route: "/feed/home", apis: ["/api/feed/pinned", "/api/feed/popular", "/api/feed/following", "/api/feed/mutuals"] },
        { setting: "search", route: "/feed/search", apis: ["/api/feed/search?text=feedAvailability"] },
        { setting: "topics", route: "/feed/topics", apis: ["/api/feed/topics"] },
        { setting: "posts", route: "/feed/posts", apis: ["/api/post"] },
        { setting: "threads", route: "/feed/threads", apis: ["/api/thread"] },
        { setting: "images", route: "/feed/gallery", apis: ["/api/gallery"] },
        { setting: "audio", route: "/feed/audio", apis: ["/api/audio"] },
        { setting: "links", route: "/feed/links", apis: [] },
    ]
    let postId: string | undefined

    try {
        const enabledFeeds = { ...originalSettings.feeds, ...Object.fromEntries(feedCases.map(({ setting }) => [setting, true])) }
        expectStatus(await updateFeeds(enabledFeeds), 200, "enable dedicated feeds")

        for (const { setting, route, apis } of feedCases) {
            const [routeResponse, apiResponses] = await Promise.all([
                fetch(route),
                Promise.all(apis.map(api => admin.fetchRaw(api))),
            ])
            expectStatus(routeResponse, 200, `enabled route ${route}`)
            for (const [index, response] of apiResponses.entries()) {
                expectStatus(response, 200, `enabled API ${apis[index]}`)
            }
        }

        for (const { setting, route, apis } of feedCases) {
            expectStatus(await updateFeeds({ ...enabledFeeds, [setting]: false }), 200, `disable feeds.${setting}`)
            const [routeResponse, disabledApiResponses] = await Promise.all([
                fetch(route),
                Promise.all(apis.map(api => admin.fetchRaw(api))),
            ])
            expectStatus(routeResponse, 404, `disabled route ${route}`)
            for (const [index, response] of disabledApiResponses.entries()) {
                expectStatus(response, 404, `disabled API ${apis[index]}`)
            }
            if (setting === "topics") {
                const [topicResponse, availableTopicsResponse] = await Promise.all([
                    admin.fetchRaw("/api/topic"),
                    admin.fetchRaw("/api/topic/available"),
                ])
                expectStatus(topicResponse, 200, "shared topic listing remains available")
                expectStatus(availableTopicsResponse, 200, "topic selection remains available")
            }
            if (setting === "links") {
                expectStatus(await admin.fetchRaw("/api/link"), 200, "general link listing remains unfiltered")
            }
        }

        const postResponse = await admin.fetchRaw<Post>("/api/post/add", {
            method: "POST",
            body: {
                title: `Disabled feed aggregate ${Date.now()}`,
                content: "This post remains visible in aggregate discovery.",
                topics: [],
                images: [],
            },
        })
        expectStatus(postResponse, 200)
        postId = extractId(postResponse._data!.id)
        expect(postId).toBeDefined()

        expectStatus(await updateFeeds({ ...originalSettings.feeds, discover: true, posts: false }), 200)
        const [dedicatedPostsResponse, postDetailResponse, aggregateFeed] = await Promise.all([
            admin.fetchRaw("/api/post"),
            admin.fetchRaw(`/api/post/${postId}`),
            admin.fetchRaw<FeedPage<Sortable>>("/api/feed/popular?sortBy=new&pageSize=50"),
        ])
        expectStatus(dedicatedPostsResponse, 404, "dedicated post list is unavailable")
        expectStatus(postDetailResponse, 200, "post detail remains available")
        expectStatus(aggregateFeed, 200)
        expect(aggregateFeed._data?.items.some(item => item.id === `post:${postId}`)).toBe(true)
    }
    finally {
        try {
            if (postId) {
                expectStatus(await admin.fetchRaw(`/api/post/${postId}/delete`), 200, "delete test post")
            }
        }
        finally {
            expectStatus(await updateFeeds(originalSettings.feeds), 200, "restore app feed settings")
        }
    }
}, 60_000)
