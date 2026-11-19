import { expect, test } from "../utils/browser-fixtures"

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

    await page.goto("/settings/filters")
    await expect(page.locator("section.box select").first()).toHaveValue("filter")

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

