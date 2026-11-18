import { expect, test } from "../utils/browser-fixtures"

test("toggles and cancels an unsaved preference", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/settings/preferences")

    const preferenceRow = authenticatedPage.locator(".field.row").filter({ hasText: "enable animations" })
    const animationToggle = preferenceRow.locator("input[type='checkbox']")
    await expect(animationToggle).toBeChecked()
    await preferenceRow.locator("label.toggle").click()
    await expect(animationToggle).not.toBeChecked()

    await authenticatedPage.getByRole("button", { name: "Cancel" }).click()
    await expect(animationToggle).toBeChecked()
})

for (const path of ["/settings/preferences", "/settings/filters"]) {
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
    await authenticatedPage.goto("/settings/misc")
    await authenticatedPage.getByRole("button", { name: /Sign Out Everywhere/ }).click()

    const confirmation = authenticatedPage.getByRole("heading", { name: "Sign Out Everywhere?" })
    await expect(confirmation).toBeVisible()
    await authenticatedPage.getByRole("button", { name: "No", exact: true }).click()
    await expect(confirmation).toBeHidden()
    await expect(authenticatedPage.locator("nav").getByText("TestAdmin", { exact: true })).toBeVisible()
})