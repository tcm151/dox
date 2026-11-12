import { expect, test } from "../utils/browser-fixtures"
import { extractId } from "../../shared/utils/records"

test("renders and navigates the home and posts feeds with shared sample data", async ({ page, exampleServer }) => {
    expect(exampleServer.users.postAuthor.user.name).toMatch(/^Example/)
    await page.goto("/feed/home")

    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "New" })).toBeVisible()
    await page.getByRole("button", { name: "Hot" }).click()
    await expect(page.getByRole("button", { name: "Hot" })).toHaveClass(/selected/)

    await page.getByRole("link", { name: /Posts/ }).click()
    await expect(page).toHaveURL(/\/feed\/posts$/)
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible()
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
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