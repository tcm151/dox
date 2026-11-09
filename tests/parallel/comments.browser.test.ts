import { expect, test } from "../utils/browser-fixtures"

const samplePostTitle = "Browser suite sample post"
const sampleComment = "A representative comment seeded for browser integration tests."

test("renders the seeded comment and opens its options", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/feed/posts")

    const postPreview = authenticatedPage.locator(".post.clickable").filter({ hasText: samplePostTitle })
    await postPreview.locator(".main").click()
    await expect(authenticatedPage).toHaveURL(/\/post\/[^/]+$/)

    const comment = authenticatedPage.locator("main.comment").filter({ hasText: sampleComment })
    await expect(comment).toBeVisible()
    await comment.locator('[title="Options"]').click()

    const options = authenticatedPage.getByRole("heading", { name: "Options" })
    await expect(options).toBeVisible()
    const optionsWindow = authenticatedPage.locator("main.window").filter({ has: options })
    await expect(optionsWindow.getByRole("button", { name: /Report/ })).toBeVisible()
    await optionsWindow.locator("button.close").click()
    await expect(options).toBeHidden()
})