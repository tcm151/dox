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

test("opens and closes the Profiles window from authenticated navigation", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator("nav").getByRole("link", { name: "Submit" })).toBeVisible()
    await expect(authenticatedPage.locator("nav").getByRole("link", { name: "Inbox" })).toBeVisible()

    await authenticatedPage.locator("nav").getByRole("link", { name: /TestAdmin/ }).click({ button: "right" })
    await expect(authenticatedPage.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await expect(authenticatedPage.getByText("New Login", { exact: true })).toBeVisible()
    await authenticatedPage.locator("main.window button.close").click()
    await expect(authenticatedPage.getByRole("heading", { name: "Profiles" })).toBeHidden()
})

test("renders a public page and navigates to contact", async ({ page }) => {
    await page.goto("/about")

    await expect(page.locator("main.page article")).toBeVisible()
    await expect(page.getByRole("link", { name: "Contact", exact: true })).toBeVisible()
    await page.getByRole("link", { name: "Contact", exact: true }).click()

    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.locator("main.page")).toBeVisible()
})