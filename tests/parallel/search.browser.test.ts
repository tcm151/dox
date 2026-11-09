import { expect, test } from "../utils/browser-fixtures"

const samplePostTitle = "Browser suite sample post"

test("finds the seeded post through the feed search UI", async ({ page }) => {
    await page.goto("/feed/search")

    const searchInput = page.getByRole("searchbox", { name: "Search..." })
    await searchInput.fill(samplePostTitle)
    await searchInput.press("Enter")

    await expect(page.locator(".feed-items").getByText(samplePostTitle, { exact: true })).toBeVisible()
})