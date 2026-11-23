import { expect, test } from "../utils/browser-fixtures"

test("clears tab state on an app update and preserves local storage", async ({ page, exampleServer }) => {
    const { user, accessToken } = exampleServer.users.threadAuthor
    const cacheKey = `cache:${user.id}`
    const tokens = JSON.stringify({ access: accessToken })
    const profiles = JSON.stringify([{ id: user.id, name: user.name, token: accessToken }])

    await page.goto("/feed/home")
    await expect(page.locator("nav").getByText("Login", { exact: true })).toBeVisible()
    await page.evaluate(({ user, tokens, profiles }) => {
        sessionStorage.setItem("authenticated", "true")
        sessionStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("tokens", tokens)
        localStorage.setItem("profiles", profiles)
    }, { user, tokens, profiles })

    await page.reload()
    await expect(page.locator("nav").getByText(user.name, { exact: true })).toBeVisible()
    const top = page.locator('button[title="Top"]')
    await top.click()
    await expect.poll(() => page.evaluate(key => JSON.parse(sessionStorage.getItem(key) ?? "{}")["feed.sort"], cacheKey)).toBe("top")

    await page.reload()
    await expect(page.locator("nav").getByText(user.name, { exact: true })).toBeVisible()
    await expect(top).toHaveClass(/\bselected\b/)

    await page.evaluate(() => sessionStorage.setItem("appVersion", "previous-version"))
    await page.reload()
    await expect(page.locator("nav").getByText("Login", { exact: true })).toBeVisible()
    expect(await page.evaluate(key => ({
        cache: sessionStorage.getItem(key),
        tokens: localStorage.getItem("tokens"),
        profiles: localStorage.getItem("profiles"),
    }), cacheKey)).toEqual({ cache: null, tokens, profiles })
})

test("closes the Login popup without authenticating", async ({ page }) => {
    await page.goto("/feed")
    await page.locator("nav").getByText("Login", { exact: true }).click()

    const loginHeading = page.getByRole("heading", { name: "Login" })
    await expect(loginHeading).toBeVisible()
    await expect(page.locator("main.form input[type='text']")).toBeVisible()
    await page.getByRole("button", { name: "Cancel", exact: true }).click()

    await expect(loginHeading).toBeHidden()
    await expect(page.locator("nav").getByText("Login", { exact: true })).toBeVisible()
})

test("opens and closes the Profiles window from authenticated navigation", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator("nav").getByRole("link", { name: "Submit" })).toBeVisible()
    await expect(authenticatedPage.locator("nav").getByRole("link", { name: "Inbox" })).toBeVisible()

    await authenticatedPage.locator("nav").getByRole("link", { name: /TestAdmin/ }).click({ button: "right" })
    await expect(authenticatedPage.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await expect(authenticatedPage.getByText("New Login", { exact: true })).toBeVisible()
    await authenticatedPage.locator("main.window button.close").click()
    await expect(authenticatedPage.getByRole("heading", { name: "Profiles" })).toBeHidden()
})

test("shows unread notification count on the inbox navigation icon", async ({ authenticatedPage }) => {
    await authenticatedPage.route("**/api/profile/notifications**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                total: 4,
                items: [{
                    id: "notification:badge",
                    recipient: "user:browser",
                    context: "thread:badge",
                    message: "Badge notification",
                    time: new Date().toISOString(),
                    viewed: false,
                }],
                pageSize: 1,
                offset: 0,
                more: true,
            }),
        })
    })
    await authenticatedPage.goto("/feed")

    const inbox = authenticatedPage.locator("nav").getByRole("link", { name: "Inbox" })
    await expect(inbox).toBeVisible()
    await expect(inbox.locator(".inbox-count")).toHaveText("4")
})

test("renders a public page and navigates to contact", async ({ page }) => {
    const response = await page.goto("/about")
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/about$/)

    await expect(page.locator("main.page article")).toBeVisible()
    await expect(page.getByRole("link", { name: "Contact", exact: true })).toBeVisible()
    await page.getByRole("link", { name: "Contact", exact: true }).click()

    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.locator("main.page")).toBeVisible()
})