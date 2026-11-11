import { expect, test } from "../utils/browser-fixtures"
import { extractId } from "../../shared/utils/records"

test("admins can lock and unlock topics from the admin topics page", async ({ authenticatedPage: page }) => {
    const topicId = `topicLockBrowser${Date.now()}`
    let postId: string | undefined

    const accessToken = await page.evaluate(() => {
        const tokens = JSON.parse(localStorage.getItem("tokens") ?? "{}")
        return tokens.access as string
    })
    const apiUrl = (path: string) => new URL(path, page.url()).toString()

    try {
        await test.step("create the topic fixture", async () => {
            const postResponse = await page.request.post(apiUrl("/api/post/add"), {
                headers: { Authorization: accessToken },
                data: {
                    title: `Topic lock browser ${Date.now()}`,
                    content: "Admin lock workflow browser test.",
                    topics: [`topic:${topicId}`],
                    images: [],
                },
            })
            expect(postResponse.ok()).toBe(true)
            const post = await postResponse.json() as { id: string }
            postId = extractId(post.id)
        })

        await test.step("lock the topic from the admin page", async () => {
            await page.goto("/admin/topics", { timeout: 10_000 })
            const topicRow = page.locator(".row.wrap.inline.g-1").filter({ hasText: topicId })
            await expect(page.getByRole("heading", { name: "Topics", exact: true })).toBeVisible({ timeout: 5_000 })
            await expect(topicRow).toBeVisible({ timeout: 5_000 })
            await expect(topicRow.locator(".tag.positive")).toBeVisible({ timeout: 5_000 })
            await expect(topicRow.locator(".tag.info[title]")).toBeVisible({ timeout: 5_000 })
            await topicRow.getByText("Active", { exact: true }).click({ timeout: 5_000 })
            await expect(topicRow.getByText("Locked", { exact: true })).toBeVisible({ timeout: 5_000 })
        })

        await test.step("show the locked state on the topic page", async () => {
            await page.goto(`/topic/${topicId}`, { timeout: 10_000 })
            await expect(page.getByText("Locked", { exact: true })).toBeVisible({ timeout: 5_000 })
        })

        await test.step("unlock the topic from the admin page", async () => {
            await page.goto("/admin/topics", { timeout: 10_000 })
            const unlockedTopicRow = page.locator(".row.wrap.inline.g-1").filter({ hasText: topicId })
            await unlockedTopicRow.getByText("Locked", { exact: true }).click({ timeout: 5_000 })
            await expect(unlockedTopicRow.getByText("Active", { exact: true })).toBeVisible({ timeout: 5_000 })
        })
    }
    finally {
        await page.request.post(apiUrl("/api/developer/database/query"), {
            headers: { Authorization: accessToken },
            data: { query: `DELETE moderatorLog WHERE target = topic:${topicId};` },
            timeout: 5_000,
        })
        if (postId) {
            await page.request.get(apiUrl(`/api/post/${postId}/delete`), {
                headers: { Authorization: accessToken },
                timeout: 5_000,
            })
        }
    }
})
