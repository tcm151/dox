import { expect, test } from "../utils/browser-fixtures"

const sampleThread = "A representative thread seeded for browser integration tests."

test("opens the seeded thread from the thread feed", async ({ page }) => {
    await page.goto("/feed/threads")

    const threadPreview = page.locator(".thread.clickable").filter({ hasText: sampleThread })
    await expect(threadPreview).toBeVisible()
    await threadPreview.locator(".main").click()

    await expect(page).toHaveURL(/\/thread\/[^/]+$/)
    await expect(page.locator("section.main").getByText(sampleThread, { exact: true })).toBeVisible()
})

test("shows quarantined thread state without hiding its content", async ({ page }) => {
    let intercepted = false
    await page.route(/\/api\/thread\/[^/]+$/, async (route) => {
        const response = await route.fetch()
        const body: unknown = await response.json()
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            throw new Error("Thread API response was not an object.")
        }

        intercepted = true
        await route.fulfill({ response, json: { ...body, status: "quarantined" } })
    })

    await page.goto("/feed/threads")
    const threadPreview = page.locator(".thread.clickable").filter({ hasText: sampleThread })
    await expect(threadPreview).toBeVisible()
    await threadPreview.locator(".main").click()

    await expect(page).toHaveURL(/\/thread\/[^/]+$/)
    const threadPage = page.locator("section.main")
    await expect(threadPage.getByText("Removed", { exact: true })).toBeVisible()
    await expect(threadPage.getByText(sampleThread, { exact: true })).toBeVisible()
    expect(intercepted).toBe(true)
})

test("shows a sign-in hint when a guest tries to reply", async ({ page }) => {
    await page.goto("/feed/threads")

    const threadPreview = page.locator(".thread.clickable").filter({ hasText: sampleThread })
    await expect(threadPreview).toBeVisible()
    await threadPreview.locator(".main").click()
    await expect(page).toHaveURL(/\/thread\/[^/]+$/)
    const threadPage = page.locator("section.main")
    await expect(threadPage.getByText(sampleThread, { exact: true })).toBeVisible()
    const replyButton = threadPage.getByRole("button", { name: "Reply", exact: true })
    await expect(replyButton).toBeVisible()
    await replyButton.click()
    await page.locator(".reply-composer textarea").fill("Guest reply attempt")
    await page.locator(".reply-composer").getByRole("button", { name: "Reply", exact: true }).click()

    await expect(page.locator(".hint").filter({ hasText: "You must be logged in to interact with others." })).toBeVisible()
})

test("opens the seeded thread options without changing it", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/feed/threads")

    const threadPreview = authenticatedPage.locator(".thread.clickable").filter({ hasText: sampleThread })
    await threadPreview.locator(".main").click()
    await expect(authenticatedPage).toHaveURL(/\/thread\/[^/]+$/)
    await expect(authenticatedPage.locator("section.main").getByText(sampleThread, { exact: true })).toBeVisible()
    await authenticatedPage.locator("section.main").getByRole("button", { name: "Options" }).click()

    await expect(authenticatedPage.getByRole("heading", { name: "Options" })).toBeVisible()
    await expect(authenticatedPage.locator("main.window").getByRole("button", { name: /Pin/ })).toBeVisible()
    const optionsWindow = authenticatedPage.locator("main.window").filter({
        has: authenticatedPage.getByRole("heading", { name: "Options" }),
    })
    await optionsWindow.locator("button.close").click()
    await expect(authenticatedPage.getByRole("heading", { name: "Options" })).toBeHidden()
})