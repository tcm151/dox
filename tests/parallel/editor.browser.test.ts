import { expect, test } from "../utils/browser-fixtures"

test("loads the post editor without client initialization errors", async ({ authenticatedPage }) => {
    const pageErrors: string[] = []
    authenticatedPage.on("pageerror", error => pageErrors.push(error.message))

    await authenticatedPage.goto("/editor/post")
    await expect(authenticatedPage.locator("section.editor")).toBeVisible()
    expect(pageErrors).toEqual([])
})

test("formats selected Markdown and toggles the rendered post preview", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/editor/post")

    const titleField = authenticatedPage.locator("section.editor .field").filter({ hasText: "Title" })
    const title = titleField.locator("input[type='text']")
    const content = authenticatedPage.locator("section.editor textarea")
    await title.fill("Preview interaction sample")
    await content.fill("selected words")
    await content.selectText()
    await authenticatedPage.locator('button[title="Bold"]').click()
    await expect(content).toHaveValue("**selected words**")

    await authenticatedPage.getByRole("button", { name: /Preview/ }).click()
    await expect(authenticatedPage.locator("section.editor")).toBeHidden()
    await expect(authenticatedPage.locator("section.preview")).toBeVisible()
    await expect(authenticatedPage.locator("section.preview h1")).toHaveText("Preview interaction sample")
    await expect(authenticatedPage.locator("section.preview strong")).toHaveText("selected words")

    await authenticatedPage.getByRole("button", { name: /Preview/ }).click()
    await expect(content).toBeVisible()
    await expect(content).toHaveValue("**selected words**")
})