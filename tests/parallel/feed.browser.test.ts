import type { FeedPage, Post } from "../../shared/types"
import { expect, test } from "../utils/browser-fixtures"

test("isolates Home feed results and pagination when switching types", async ({ authenticatedPage: page }) => {
    function post(id: string, title: string): Post<string[]> {
        return {
            id: `post:feed-switch-${id}`,
            title,
            content: "Home feed switching fixture",
            user: { id: "user:feed-switch-author", name: "Feed Switch Author", roles: [] },
            time: "2026-01-01T00:00:00.000Z",
            score: 0,
            visits: 0,
            votes: { positive: [], misleading: [], negative: [], awards: [], saves: [] },
            tags: [],
            topics: [],
            comments: [],
            images: [],
            status: "active",
            edited: false,
        }
    }

    let followingResponse: "items" | "delayed" | "empty" | "error" = "items"
    let releaseStaleResponse = () => {}
    const staleResponseGate = new Promise<void>(resolve => { releaseStaleResponse = resolve })
    const isFollowing = (url: URL) => url.pathname === "/api/feed/following"

    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.route(url => url.pathname === "/api/feed/pinned", route => route.fulfill({
        json: [{ id: "pin:feed-switch", item: post("pin", "Pinned across feed switches") }],
    }))
    await page.route(url => url.pathname === "/api/feed/popular" || isFollowing(url), async (route) => {
        const url = new URL(route.request().url())
        const offset = url.searchParams.get("offset")
        if (offset !== "0" && offset !== "20") {
            await route.fulfill({ status: 400, json: { statusMessage: `Unexpected feed offset ${offset}` } })
            return
        }

        const following = isFollowing(url)
        const response = following ? followingResponse : "items"
        if (response === "error") {
            await route.fulfill({ status: 400, json: { statusMessage: "Simulated Following feed failure" } })
            return
        }
        if (response === "delayed") await staleResponseGate

        const feed = following ? "Following" : "Popular"
        const pageNumber = offset === "0" ? 1 : 2
        const result: FeedPage<Post<string[]>> = {
            items: response === "empty" ? [] : [post(`${feed}-${pageNumber}`, `${feed} page ${pageNumber}`)],
            pageSize: 20,
            offset: Number(offset),
            more: response === "items" && pageNumber === 1,
        }
        await route.fulfill({ json: result })
    })

    // Navigate to Home on the client so Playwright can intercept the feed and pin requests.
    await page.goto("/feed/search")
    await page.locator("nav.tabstrip").getByRole("link", { name: "Home" }).click()
    const feedItems = page.locator(".feed-items")
    const titles = feedItems.getByRole("heading")
    const pinned = page.locator(".post.pinned").getByRole("heading", { name: "Pinned across feed switches", exact: true })
    const popular = page.getByRole("button", { name: /^popular$/i })
    const following = page.getByRole("button", { name: /^following$/i })
    const mutuals = page.getByRole("button", { name: /^mutuals$/i })
    const loadMore = page.getByRole("button", { name: "Load More" })

    await expect(titles).toHaveText(["Popular page 1"])
    await expect(pinned).toBeVisible()
    const documentRequests: string[] = []
    page.on("request", (request) => {
        if (request.resourceType() === "document") documentRequests.push(request.url())
    })

    try {
        await loadMore.click()
        await expect(titles).toHaveText(["Popular page 1", "Popular page 2"])

        await popular.click()
        await expect(titles).toHaveText(["Following page 1"])
        await loadMore.click()
        await expect(titles).toHaveText(["Following page 1", "Following page 2"])
        await following.click()
        await mutuals.click()
        await expect(titles).toHaveText(["Popular page 1"])

        followingResponse = "delayed"
        const [staleRequest] = await Promise.all([
            page.waitForRequest(request => isFollowing(new URL(request.url()))),
            popular.click(),
        ])
        await expect(feedItems.getByRole("status")).toHaveText("Loading feed...")
        await expect(titles).toHaveCount(0)
        await following.click()
        await mutuals.click()
        await expect(titles).toHaveText(["Popular page 1"])
        releaseStaleResponse()
        const staleResponse = await staleRequest.response()
        await staleResponse?.finished()
        await expect(titles).toHaveText(["Popular page 1"])

        followingResponse = "empty"
        await popular.click()
        await expect(feedItems.getByText("There is nothing here currently.", { exact: true })).toBeVisible()
        await expect(titles).toHaveCount(0)

        await following.click()
        await mutuals.click()
        await expect(titles).toHaveText(["Popular page 1"])
        followingResponse = "error"
        await popular.click()
        await expect(feedItems.getByRole("alert")).toContainText("Unable to load this feed.")
        await expect(titles).toHaveCount(0)
        await expect(pinned).toBeVisible()
        expect(documentRequests).toEqual([])
    }
    finally {
        releaseStaleResponse()
    }
})

test("shows pending feed loading before a successful empty result", async ({ authenticatedPage: page }) => {
    let signalRequest = () => {}
    let releaseResponse = () => {}
    const requestStarted = new Promise<void>(resolve => { signalRequest = resolve })
    const responseGate = new Promise<void>(resolve => { releaseResponse = resolve })

    await page.route(url => url.pathname === "/api/post", async (route) => {
        signalRequest()
        await responseGate
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ items: [], pageSize: 20, offset: 0, more: false }),
        })
    })

    try {
        await page.locator("nav.tabstrip").getByRole("link", { name: "Posts" }).click()
        await requestStarted
        await expect(page.locator(".feed-items").getByRole("status")).toHaveText("Loading feed...")
        await expect(page.getByText("There is nothing here currently.")).toHaveCount(0)

        releaseResponse()
        await expect(page.getByText("There is nothing here currently.", { exact: true })).toBeVisible()
        await expect(page.locator(".feed-items").getByRole("status")).toHaveCount(0)
    }
    finally {
        releaseResponse()
    }
})

test("distinguishes content filtered by visibility preferences from an empty feed", async ({ authenticatedPage: page }) => {
    await page.route(url => url.pathname === "/api/profile/settings", async (route) => {
        const response = await route.fetch()
        const settings = await response.json() as {
            content: { visibility: Record<string, string> }
        }
        settings.content.visibility.nsfw = "filter"
        await route.fulfill({ response, json: settings })
    })

    await page.goto("/profile/filters")
    await expect(page.locator("select[name='content.visibility.nsfw']")).toHaveValue("filter")

    await page.route(url => url.pathname === "/api/post", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                items: [{ id: "post:visibility-filtered", tags: ["nsfw"] }],
                pageSize: 20,
                offset: 0,
                more: false,
            }),
        })
    })

    await page.locator("nav a.title").click()
    await page.locator("nav.tabstrip").getByRole("link", { name: "Posts" }).click()
    await expect(page.getByText("No content matches your visibility preferences.", { exact: true })).toBeVisible()
    await expect(page.getByText("There is nothing here currently.", { exact: true })).toHaveCount(0)
})

test("retains loaded feed items after a refresh fails", async ({ authenticatedPage: page }) => {
    let requests = 0
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    const feedItems = page.locator(".feed-items .feed-item")
    const loadedItemCount = await feedItems.count()
    expect(loadedItemCount).toBeGreaterThan(0)

    await page.route(url => url.pathname === "/api/feed/popular", async (route) => {
        requests++
        await route.fulfill({
            status: 400,
            contentType: "application/json",
            headers: { "x-request-id": "feed-refresh-failure" },
            body: JSON.stringify({ statusCode: 400, statusMessage: "Simulated feed refresh failure" }),
        })
    })

    await page.locator("button.refresh").click()
    await expect.poll(() => requests).toBe(1)
    await expect(feedItems).toHaveCount(loadedItemCount)
    await expect(feedItems.first()).toBeVisible()
    await expect(page.locator(".feed-items .empty-state")).toHaveCount(0)
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    await expect(page.locator(".hint.danger")).toBeVisible()
})

