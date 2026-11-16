import { expect, test } from "../utils/browser-fixtures"

test("refreshes stale feeds on fresh navigation, not history traversal, and retains content on failure", async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/\/feed\/home$/)
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    await page.waitForLoadState("networkidle")

    let popularRequests = 0
    let failNextRequest = true
    await page.route(url => url.pathname === "/api/feed/popular", async (route) => {
        popularRequests += 1
        if (failNextRequest) {
            failNextRequest = false
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({ statusCode: 400, statusMessage: "Feed request failed" }),
            })
            return
        }

        await route.continue()
    })

    await page.evaluate(() => {
        const staleTime = Date.now() + 60_001
        Date.now = () => staleTime
    })

    await page.locator("nav").getByRole("link", { name: "Inbox" }).click()
    await expect(page).toHaveURL(/\/inbox$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/feed\/home$/)
    await page.waitForLoadState("networkidle")
    expect(popularRequests).toBe(0)

    const failedRefresh = page.waitForResponse(response =>
        new URL(response.url()).pathname === "/api/feed/popular" && response.status() === 400,
    )
    await page.locator("nav").getByRole("link", { name: "Inbox" }).click()
    await expect(page).toHaveURL(/\/inbox$/)
    await page.locator("nav a.title").click()
    await expect(page).toHaveURL(/\/feed\/home$/)
    await failedRefresh
    expect(popularRequests).toBe(1)
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()

    const recoveredRefresh = page.waitForResponse(response =>
        new URL(response.url()).pathname === "/api/feed/popular" && response.status() === 200,
    )
    await page.locator("nav").getByRole("link", { name: "Inbox" }).click()
    await expect(page).toHaveURL(/\/inbox$/)
    await page.locator("nav a.title").click()
    await expect(page).toHaveURL(/\/feed\/home$/)
    await recoveredRefresh
    expect(popularRequests).toBe(2)
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
})
