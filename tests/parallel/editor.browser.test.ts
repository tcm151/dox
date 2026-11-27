import { extractId } from "../../shared/utils/records"
import { expect, test } from "../utils/browser-fixtures"
import type { Draft, AppSettings } from "../../shared/types"

test("loads the post editor without client initialization errors", async ({ authenticatedPage }) => {
    const pageErrors: string[] = []
    authenticatedPage.on("pageerror", error => pageErrors.push(error.message))

    await authenticatedPage.goto("/editor/post")
    await expect(authenticatedPage.locator("section.editor")).toBeVisible()
    expect(pageErrors).toEqual([])
})

test("saves and updates post drafts with the supported request fields", async ({ authenticatedPage: page }) => {
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const userId = await page.evaluate(() => JSON.parse(sessionStorage.getItem("user") ?? "{}").id as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    const title = `Draft contract ${Date.now()}`
    const content = "A draft with a typed creation request."
    let draftId: string | undefined

    try {
        await page.goto("/editor/post")
        const titleInput = page.locator("section.editor .field").filter({ hasText: "Title" }).locator("input[type='text']")
        const contentInput = page.locator("section.editor textarea")
        await titleInput.fill(title)
        await contentInput.fill(content)

        const createResponsePromise = page.waitForResponse(response =>
            new URL(response.url()).pathname === "/api/profile/drafts/add"
            && response.request().method() === "POST",
        )
        await page.getByRole("button", { name: /Save/ }).click()
        const createResponse = await createResponsePromise
        expect(createResponse.ok()).toBe(true)

        const createdDraft = await createResponse.json() as Draft
        draftId = extractId(createdDraft.id)
        if (!draftId) throw new Error("The created draft did not return an ID.")
        expect(createdDraft).toMatchObject({ user: userId, title, content })

        const createBody = createResponse.request().postDataJSON() as Record<string, unknown>
        expect(Object.keys(createBody).sort()).toEqual(["content", "images", "tags", "title", "topics"])
        expect(createBody).not.toHaveProperty("user")
        expect(createBody).not.toHaveProperty("time")
        await expect(page.locator(".hint.success").filter({ hasText: "Draft saved." })).toBeVisible()

        const updatedTitle = `${title} updated`
        const updatedContent = "The saved draft was updated."
        await titleInput.fill(updatedTitle)
        await contentInput.fill(updatedContent)

        const updateResponsePromise = page.waitForResponse(response =>
            new URL(response.url()).pathname === `/api/profile/drafts/${draftId}/update`
            && response.request().method() === "POST",
        )
        await page.getByRole("button", { name: /Update/ }).click()
        const updateResponse = await updateResponsePromise
        expect(updateResponse.ok()).toBe(true)
        expect(await updateResponse.json() as Draft).toMatchObject({
            id: `draft:${draftId}`,
            user: userId,
            title: updatedTitle,
            content: updatedContent,
        })

        const updateBody = updateResponse.request().postDataJSON() as Record<string, unknown>
        expect(Object.keys(updateBody).sort()).toEqual(["content", "tags", "title", "topics"])
        expect(updateBody).not.toHaveProperty("replyTo")
        expect(updateBody).not.toHaveProperty("images")
        await expect(page.locator(".hint.success").filter({ hasText: "Draft updated." })).toBeVisible()

        const draftsResponse = await page.request.get(apiUrl("/api/profile/drafts"), {
            headers: { Authorization: accessToken },
        })
        expect(draftsResponse.ok()).toBe(true)
        const drafts = await draftsResponse.json() as Draft[]
        expect(drafts.find(draft => extractId(draft.id) === draftId)).toMatchObject({
            title: updatedTitle,
            content: updatedContent,
        })
    }
    finally {
        if (draftId) {
            const response = await page.request.post(apiUrl(`/api/profile/drafts/${draftId}/delete`), {
                headers: { Authorization: accessToken },
            })
            expect(response.ok()).toBe(true)
        }
    }
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

test("blocks direct post and thread editor routes when publishing is disabled", async ({ authenticatedPage: page }) => {
    const response = await page.request.get(new URL("/api/settings/default", page.url()).toString())
    expect(response.ok()).toBe(true)
    const settings = await response.json() as AppSettings

    await page.route("**/api/settings/default", async (route) => {
        await route.fulfill({
            json: {
                ...settings,
                posts: { ...settings.posts, enabled: false },
                threads: { ...settings.threads, enabled: false },
            },
        })
    })

    await page.goto("/editor/post")
    await expect(page.getByRole("heading", { name: "New Post" })).toHaveCount(0)

    await page.goto("/editor/thread")
    await expect(page.getByRole("heading", { name: "New Thread" })).toHaveCount(0)
})

test("labels the editor fields for assistive technology", async ({ authenticatedPage: page }) => {
    await page.goto("/editor/post")
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Content", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Bold", exact: true })).toBeVisible()

    await page.goto("/editor/link")
    await expect(page.getByRole("textbox", { name: "Link", exact: true })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Description", exact: true })).toBeVisible()
})
