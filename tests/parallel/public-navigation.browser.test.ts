import { expect, test } from "../utils/browser-fixtures"

test("renders a public page and navigates to contact", async ({ page }) => {
    await page.goto("/about")

    await expect(page.locator("main.page article")).toBeVisible()
    await expect(page.getByRole("link", { name: "Contact", exact: true })).toBeVisible()
    await page.getByRole("link", { name: "Contact", exact: true }).click()

    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.locator("main.page")).toBeVisible()
})