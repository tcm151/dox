import { expect, test } from "../utils/browser-fixtures"

test("toggles and cancels an unsaved preference", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/profile/preferences")

    const preferenceRow = authenticatedPage.locator(".field.row").filter({ hasText: "enable animations" })
    const animationToggle = preferenceRow.locator("input[type='checkbox']")
    await expect(animationToggle).toBeChecked()
    await preferenceRow.locator("label.toggle").click()
    await expect(animationToggle).not.toBeChecked()

    await authenticatedPage.getByRole("button", { name: "Cancel" }).click()
    await expect(animationToggle).toBeChecked()
})

test("uses defaults while logged out and reloads preferences after login", async ({ authenticatedPage: page }) => {
    const session = await page.evaluate(() => ({
        user: JSON.parse(sessionStorage.getItem("user") ?? "null"),
        token: JSON.parse(localStorage.getItem("tokens") ?? "{}").access,
    }))
    let preferenceRequests = 0

    await page.route(url => new URL(url).pathname === "/api/profile/settings", async (route) => {
        if (route.request().method() !== "GET") {
            await route.continue()
            return
        }

        preferenceRequests++
        const response = await route.fetch()
        const settings = await response.json() as {
            privacy: { profile: string }
            ui: { hoverAnimations: boolean }
        }
        settings.privacy.profile = "members"
        settings.ui.hoverAnimations = false
        await route.fulfill({ response, json: settings })
    })
    await page.route(url => new URL(url).pathname === "/api/profile/login", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ user: session.user, tokens: { access: session.token } }),
        })
    })

    await page.goto("/profile/preferences")
    await expect.poll(() => preferenceRequests).toBe(1)
    await expect(page.locator("html")).toHaveAttribute("data-hover-animations", "false")

    await page.locator('nav button[title="Logout"]').click({ button: "right" })
    await expect(page).toHaveURL(/\/feed\/home$/)
    await expect(page.locator("nav").getByText("Login", { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("authenticated"))).toBe("false")
    await expect.poll(() => preferenceRequests).toBe(1)
    await expect(page.locator("html")).toHaveAttribute("data-hover-animations", "true")

    await page.locator("nav").getByText("Login", { exact: true }).click()
    await page.locator("main.form input[type='text']").fill(session.user.name)
    await page.locator("main.form input[type='password']").fill("test")
    await page.getByRole("button", { name: "Login", exact: true }).click()

    await expect.poll(() => preferenceRequests).toBe(2)
    await expect(page.locator("html")).toHaveAttribute("data-hover-animations", "false")
})

for (const path of ["/profile/preferences", "/profile/filters"]) {
    test(`retries failed preference loading on ${path}`, async ({ authenticatedPage: page }) => {
        let attempts = 0
        let releaseFailure!: () => void
        const failureGate = new Promise<void>((resolve) => {
            releaseFailure = resolve
        })

        await page.route(url => new URL(url).pathname === "/api/profile/settings", async (route) => {
            if (route.request().method() !== "GET") {
                await route.continue()
                return
            }

            attempts++
            if (attempts === 1) {
                await failureGate
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({ statusCode: 503, statusMessage: "Simulated preference load failure" }),
                })
                return
            }
            await route.continue()
        })

        try {
            await page.goto(path)
            await expect.poll(() => attempts).toBe(1)
            const control = path.endsWith("/filters")
                ? page.locator("section.box select").first()
                : page.locator("input[type='checkbox']").first()
            await expect(control).toBeDisabled()
            await expect(page.getByRole("button", { name: "Cancel" })).toBeDisabled()

            releaseFailure()
            await expect(page.getByRole("button", { name: "Cancel" })).toBeEnabled()
            await expect(page.getByRole("button", { name: "Save" })).toBeDisabled()
            await expect(page.getByRole("alert")).toHaveText("Failed to load preferences. Use Cancel to try again.")
            await page.getByRole("button", { name: "Cancel" }).click()
            await expect.poll(() => attempts).toBe(2)
            await expect(control).toBeEnabled()
            await expect(page.getByRole("button", { name: "Save" })).toBeEnabled()
        }
        finally {
            releaseFailure()
        }
    })
}

test("opens and dismisses a settings confirmation through the event bus", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/profile/misc")
    await authenticatedPage.getByRole("button", { name: /Sign Out Everywhere/ }).click()

    const confirmation = authenticatedPage.getByRole("heading", { name: "Sign Out Everywhere?" })
    await expect(confirmation).toBeVisible()
    await authenticatedPage.getByRole("button", { name: "No", exact: true }).click()
    await expect(confirmation).toBeHidden()
    await expect(authenticatedPage.locator("nav").getByText("TestAdmin", { exact: true })).toBeVisible()
})