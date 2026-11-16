import { expect, test } from "../utils/browser-fixtures"

test("toggles and resets an unsaved preference", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/settings/preferences")

    const preferenceRow = authenticatedPage.locator(".field.row").filter({ hasText: "enable animations" })
    const animationToggle = preferenceRow.locator("input[type='checkbox']")
    await expect(animationToggle).toBeChecked()
    await preferenceRow.locator("label.toggle").click()
    await expect(animationToggle).not.toBeChecked()

    await authenticatedPage.getByRole("button", { name: /Reset/ }).click()
    await expect(animationToggle).toBeChecked()
})

test("opens and dismisses a settings confirmation through the event bus", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/settings/misc")
    await authenticatedPage.getByRole("button", { name: /Sign Out Everywhere/ }).click()

    const confirmation = authenticatedPage.getByRole("heading", { name: "Sign Out Everywhere?" })
    await expect(confirmation).toBeVisible()
    await authenticatedPage.getByRole("button", { name: "No", exact: true }).click()
    await expect(confirmation).toBeHidden()
    await expect(authenticatedPage.locator("nav").getByText("TestAdmin", { exact: true })).toBeVisible()
})