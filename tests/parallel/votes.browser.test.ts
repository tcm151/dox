import type { Post } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expect, test } from "../utils/browser-fixtures"

test("animates vote changes only after interaction and respects reduced motion", async ({ authenticatedPage: page, exampleServer }) => {
    const headers = { Authorization: exampleServer.users.postAuthor.accessToken }
    const response = await page.request.post("/api/post/add", {
        headers,
        data: { title: `Vote animation ${Date.now()}`, content: "Vote animation test post.", topics: [], images: [] },
    })
    expect(response.ok()).toBe(true)
    const post = await response.json() as Post
    const postId = extractId(post.id)
    if (!postId) throw new Error("Missing vote animation post ID.")

    const voteApi = (url: URL) => url.pathname.startsWith(`/api/vote/${post.id}/`)
    const postHeader = page.locator("section.post > header")
    const positive = postHeader.locator(".tag.positive")
    const misleading = postHeader.locator(".tag.misleading")
    const negative = postHeader.locator(".tag.negative")
    const animationCount = () => page.evaluate(() => Number(document.documentElement.dataset.voteAnimations ?? 0))

    try {
        await page.emulateMedia({ reducedMotion: "no-preference" })
        await page.addInitScript(() => {
            document.addEventListener("animationstart", (event) => {
                if (event.animationName !== "vote-state-change") return
                const root = document.documentElement
                root.dataset.voteAnimations = String(Number(root.dataset.voteAnimations ?? 0) + 1)
            })
        })
        await page.goto(`/post/${postId}`)
        await expect(positive).toBeVisible()
        await expect(positive).not.toHaveClass(/voted/)
        await expect(positive).toHaveCSS("animation-name", "none")

        const savedVote = page.waitForResponse(response => voteApi(new URL(response.url())))
        await positive.click()
        expect((await savedVote).ok()).toBe(true)
        await expect(positive).toHaveClass(/voted/)
        await expect.poll(animationCount).toBe(1)

        await page.reload()
        await expect(positive).toHaveClass(/voted/)
        await expect(positive).toHaveCSS("animation-name", "none")
        expect(await animationCount()).toBe(0)

        await page.route(voteApi, route => route.fulfill({ json: {} }))
        for (const [index, control] of [positive, misleading, negative, positive].entries()) {
            await control.click()
            if (index === 0) await expect(control).not.toHaveClass(/voted/)
            else await expect(control).toHaveClass(/voted/)
            await expect.poll(animationCount).toBe(index + 1)
            await expect(control).not.toHaveClass(/vote-state-change/)
        }

        await page.emulateMedia({ reducedMotion: "reduce" })
        await positive.click()
        await expect(positive).not.toHaveClass(/voted/)
        await expect(positive).not.toHaveClass(/vote-state-change/)
        await positive.click()
        await expect(positive).toHaveClass(/voted/)
        await expect(positive).not.toHaveClass(/vote-state-change/)
        expect(await animationCount()).toBe(4)
    }
    finally {
        const cleanup = await page.request.get(`/api/post/${postId}/delete`, { headers })
        expect(cleanup.ok()).toBe(true)
    }
})
