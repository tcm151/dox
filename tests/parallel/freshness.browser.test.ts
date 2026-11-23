import type { FeedPage, Post } from "../../shared/types"
import { expect, test } from "../utils/browser-fixtures"

test("keeps feed content on a failed refresh and updates it on retry", async ({ page }) => {
    const title = "Browser suite sample post"
    const fixture = await page.request.get(`/api/feed/search?type=post&text=${encodeURIComponent(title)}`)
    expect(fixture.ok()).toBe(true)
    const { items } = await fixture.json() as FeedPage<Post<string[]>>
    const post = items.find(item => item.title === title)
    if (!post) throw new Error("Missing browser sample post.")

    const popularFeed = (url: URL) => url.pathname === "/api/feed/popular"
    const feedItems = page.locator(".feed-items")
    const refresh = page.locator("article.feed button.refresh")
    const recoveredTitle = `${title} after retry`
    let responseTitle = title
    let failNextRefresh = false

    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.route(popularFeed, async (route) => {
        if (failNextRefresh) {
            failNextRefresh = false
            await route.fulfill({ status: 400, json: { statusMessage: "Feed request failed" } })
            return
        }
        await route.fulfill({
            json: {
                items: [{ ...post, title: responseTitle }],
                pageSize: 20,
                offset: 0,
                more: false,
            },
        })
    })

    await page.goto("/feed/search")
    await page.locator("article.feed").getByRole("link", { name: "Home" }).click()
    const originalPost = feedItems.getByRole("heading", { name: title, exact: true })
    await expect(originalPost).toBeVisible()

    const failedRefresh = page.waitForResponse(response => popularFeed(new URL(response.url())) && response.status() === 400)
    failNextRefresh = true
    await refresh.click()
    await failedRefresh
    await expect(page.locator(".hint.danger").first()).toBeVisible()
    await expect(originalPost).toBeVisible()

    responseTitle = recoveredTitle
    await refresh.click()
    await expect(feedItems.getByRole("heading", { name: recoveredTitle, exact: true })).toBeVisible()
    await expect(originalPost).toHaveCount(0)
})
