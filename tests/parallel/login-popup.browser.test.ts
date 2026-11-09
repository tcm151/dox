import { expect, test } from "../utils/browser-fixtures"

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