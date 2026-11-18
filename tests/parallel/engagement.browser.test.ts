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
    await expect(optionsWindow.getByRole("button", { name: "Lock" })).toBeVisible()
    await expect(optionsWindow.getByRole("button", { name: "Unlock" })).toHaveCount(0)
    await expect(optionsWindow.getByRole("button", { name: "Slow" })).toHaveCount(0)
    await expect(optionsWindow.getByRole("button", { name: "Award" })).toBeVisible()
    await expect(optionsWindow.getByRole("button", { name: "Pin" })).toHaveCount(0)
    await expect(optionsWindow.getByRole("button", { name: "NSFW" })).toHaveCount(0)
    await expect(optionsWindow.getByRole("button", { name: "Spoiler" })).toHaveCount(0)
    await expect(optionsWindow.getByRole("button", { name: "Save" })).toHaveCount(0)
    await optionsWindow.locator("button.close").click()
    await expect(options).toBeHidden()
})

test("saves eligible content and reflects save state and counts", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/feed/posts")
    const postPreview = authenticatedPage.locator(".post.clickable").filter({ hasText: samplePostTitle })
    await expect(postPreview.locator('[title="Saves"]')).toHaveCount(0)
    await postPreview.locator(".main").click()

    await expect(authenticatedPage).toHaveURL(/\/post\/[^/]+$/)
    await authenticatedPage.locator('button.options[title="Options"]').click()
    let options = authenticatedPage.locator("main.window").filter({
        has: authenticatedPage.getByRole("heading", { name: "Options" }),
    })
    await options.getByRole("button", { name: "Save" }).click()

    await expect(options.getByRole("button", { name: "Unsave" })).toBeVisible()
    await expect(authenticatedPage.locator('[title="Saves"]')).toContainText("1")

    await authenticatedPage.goto("/feed/posts")
    const savedPostPreview = authenticatedPage.locator(".post.clickable").filter({ hasText: samplePostTitle })
    await expect(savedPostPreview.locator('[title="Saves"]')).toContainText("1")
    await savedPostPreview.locator(".main").click()

    await authenticatedPage.locator('button.options[title="Options"]').click()
    options = authenticatedPage.locator("main.window").filter({
        has: authenticatedPage.getByRole("heading", { name: "Options" }),
    })
    await options.getByRole("button", { name: "Unsave" }).click()

    await expect(options.getByRole("button", { name: "Save" })).toBeVisible()
    await expect(authenticatedPage.locator('[title="Saves"]')).toHaveCount(0)

    await authenticatedPage.goto("/feed/posts")
    const unsavedPostPreview = authenticatedPage.locator(".post.clickable").filter({ hasText: samplePostTitle })
    await expect(unsavedPostPreview.locator('[title="Saves"]')).toHaveCount(0)
})