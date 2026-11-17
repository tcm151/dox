import { expect, test } from "../utils/browser-fixtures"
import { extractId } from "../../shared/utils/records"
import type { AppSettings } from "../../shared/types"

test("renders and navigates the home and posts feeds with shared sample data", async ({ page, exampleServer }) => {
    expect(exampleServer.users.postAuthor.user.name).toMatch(/^Example/)
    await page.goto("/feed/home")

    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    const samplePost = page.locator(".post.clickable").filter({ hasText: "Browser suite sample post" })
    await expect(samplePost.locator(".content-preview")).toContainText("A representative post seeded for browser integration tests.")
    await expect(page.getByTitle("New")).toBeVisible()
    await page.getByTitle("Hot").click()
    await expect(page.getByTitle("Hot")).toHaveClass(/selected/)

    await page.getByRole("link", { name: /Posts/ }).click()
    await expect(page).toHaveURL(/\/feed\/posts$/)
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible()
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
})

test("renders a plain-text excerpt of the first three Markdown sentences", async ({ authenticatedPage: page }) => {
    const uniqueId = Date.now().toString(36)
    const title = `Markdown excerpt ${uniqueId}`
    const content = [
        "# Preview heading",
        "First **bold** sentence with [reference link][ref].",
        "Second _italic_ sentence.",
        "Third `inline code` sentence.",
        "Fourth sentence should not appear.",
        "",
        "Padding ".repeat(80),
        "[ref]: https://example.invalid/reference",
    ].join("\n")
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    let postId: string | undefined

    try {
        const response = await page.request.post(apiUrl("/api/post/add"), {
            headers: { Authorization: accessToken },
            data: { title, content, topics: [], images: [] },
        })
        expect(response.ok()).toBe(true)
        postId = extractId((await response.json() as { id: string }).id)

        await page.goto("/feed/home")
        const preview = page.locator(".post.clickable").filter({ hasText: title }).locator(".content-preview")
        await expect(preview).toHaveText("First bold sentence with reference link. Second italic sentence. Third inline code sentence.")
        await expect(preview).not.toContainText("Preview heading")
        await expect(preview).not.toContainText("Fourth sentence should not appear")
    }
    finally {
        if (postId) {
            const response = await page.request.get(apiUrl(`/api/post/${postId}/delete`), {
                headers: { Authorization: accessToken },
            })
            expect(response.ok()).toBe(true)
        }
    }
})

test("renders link previews in the home feed", async ({ authenticatedPage: page }) => {
    const uniqueId = Date.now().toString(36)
    const title = `Feed link browser ${uniqueId}`
    const description = `Feed metadata description ${uniqueId}`
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const userId = await page.evaluate(() => JSON.parse(sessionStorage.getItem("user") ?? "{}").id as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    let created = false

    try {
        const createResponse = await page.request.post(apiUrl("/api/developer/database/query"), {
            headers: { Authorization: accessToken },
            data: {
                query: `CREATE ONLY link:feedBrowser${uniqueId} SET user = ${userId}, title = ${JSON.stringify(title)}, url = "https://example.invalid/article", preview = { title: "Feed publisher title", description: ${JSON.stringify(description)} }, topics = [];`,
            },
        })
        expect(createResponse.ok()).toBe(true)
        created = true

        await page.goto("/feed/home")
        const preview = page.locator("article.link-preview").filter({ hasText: title })
        await expect(preview).toBeVisible()
        await expect(preview.getByText(description, { exact: false })).toBeVisible()
    }
    finally {
        if (created) {
            const deleteResponse = await page.request.post(apiUrl("/api/developer/database/query"), {
                headers: { Authorization: accessToken },
                data: { query: `DELETE link:feedBrowser${uniqueId};` },
            })
            expect(deleteResponse.ok()).toBe(true)
        }
    }
})

test("shows the Links tab only when its feed is enabled", async ({ authenticatedPage: page }) => {
    const uniqueId = Date.now().toString(36)
    const title = `Dedicated link feed ${uniqueId}`
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const userId = await page.evaluate(() => JSON.parse(sessionStorage.getItem("user") ?? "{}").id as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    let originalSettings: AppSettings | undefined
    let created = false

    const updateFeedEnabled = async (enabled: boolean) => {
        if (!originalSettings) throw new Error("App settings were not loaded")
        return page.request.post(apiUrl(`/api/admin/settings/${extractId(originalSettings.id)}/update`), {
            headers: { Authorization: accessToken },
            data: { ...originalSettings, feeds: { ...originalSettings.feeds, links: enabled } },
        })
    }

    try {
        const settingsResponse = await page.request.get(apiUrl("/api/settings/default"), {
            headers: { Authorization: accessToken },
        })
        expect(settingsResponse.ok()).toBe(true)
        originalSettings = await settingsResponse.json() as AppSettings

        const createResponse = await page.request.post(apiUrl("/api/developer/database/query"), {
            headers: { Authorization: accessToken },
            data: {
                query: `CREATE ONLY link:dedicatedFeed${uniqueId} SET user = ${userId}, title = ${JSON.stringify(title)}, url = "https://example.invalid/article", topics = [];`,
            },
        })
        expect(createResponse.ok()).toBe(true)
        created = true

        const disableResponse = await updateFeedEnabled(false)
        expect(disableResponse.ok()).toBe(true)
        await page.goto("/feed/home")
        await expect(page.getByRole("link", { name: /Links/ })).toHaveCount(0)

        const enableResponse = await updateFeedEnabled(true)
        expect(enableResponse.ok()).toBe(true)
        await page.reload()
        const linksTab = page.getByRole("link", { name: /Links/ })
        await expect(linksTab).toBeVisible()
        await linksTab.click()
        await expect(page).toHaveURL(/\/feed\/links$/)
        await expect(page.locator("article.link-preview").filter({ hasText: title })).toBeVisible()
    }
    finally {
        try {
            if (created) {
                const deleteResponse = await page.request.post(apiUrl("/api/developer/database/query"), {
                    headers: { Authorization: accessToken },
                    data: { query: `DELETE link:dedicatedFeed${uniqueId};` },
                })
                expect(deleteResponse.ok()).toBe(true)
            }
        }
        finally {
            if (originalSettings) {
                const restoreResponse = await updateFeedEnabled(originalSettings.feeds.links)
                expect(restoreResponse.ok()).toBe(true)
            }
        }
    }
})

test("marks active home pins in the feed", async ({ authenticatedPage: page }) => {
    const title = `Home pin browser ${Date.now()}`
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    let postId: string | undefined
    let pinId: string | undefined

    try {
        const postResponse = await page.request.post(apiUrl("/api/post/add"), {
            headers: { Authorization: accessToken },
            data: { title, content: "An active home pin preview fixture.", topics: [], images: [] },
        })
        expect(postResponse.ok()).toBe(true)
        const post = await postResponse.json() as { id: string }
        postId = extractId(post.id)

        const pinResponse = await page.request.post(apiUrl(`/api/post/${postId}/pin`), {
            headers: { Authorization: accessToken },
        })
        expect(pinResponse.ok()).toBe(true)
        const pin = await pinResponse.json() as { id: string }
        pinId = extractId(pin.id)

        await page.goto("/feed/home")
        await expect(page.locator(".post.pinned").filter({ hasText: title })).toHaveCount(0)

        const activateResponse = await page.request.post(apiUrl(`/api/admin/pin/${pinId}/update`), {
            headers: { Authorization: accessToken },
            data: { active: true },
        })
        expect(activateResponse.ok()).toBe(true)

        await page.reload()
        const pinnedPost = page.locator(".post.pinned").filter({ hasText: title })
        await expect(pinnedPost).toBeVisible()
        await expect(pinnedPost.locator(".meta .fa-thumbtack")).toBeVisible()
    }
    finally {
        if (pinId) {
            await page.request.post(apiUrl(`/api/admin/pin/${pinId}/delete`), {
                headers: { Authorization: accessToken },
            })
        }
        if (postId) {
            await page.request.get(apiUrl(`/api/post/${postId}/delete`), {
                headers: { Authorization: accessToken },
            })
        }
    }
})