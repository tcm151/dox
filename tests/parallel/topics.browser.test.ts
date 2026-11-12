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

test("admins can manage a topic moderator roster from the topic moderators page", async ({ authenticatedPage: page }) => {
    const suffix = Date.now().toString()
    const topicId = `topicModeratorBrowser${suffix}`
    const userId = `topicModBrowser${suffix}`
    const userName = `TopicBrowser${suffix}`
    const accessToken = await page.evaluate(() => {
        const tokens = JSON.parse(localStorage.getItem("tokens") ?? "{}")
        return tokens.access as string
    })
    const apiUrl = (path: string) => new URL(path, page.url()).toString()

    try {
        const createResponse = await page.request.post(apiUrl("/api/developer/database/query"), {
            headers: { Authorization: accessToken },
            data: {
                query: `
                    CREATE ONLY user:${userId} SET name = "${userName}", roles = ["moderator"];
                    CREATE ONLY topic:${topicId} SET moderators = [user:${userId}];
                `,
            },
        })
        expect(createResponse.ok()).toBe(true)

        await page.goto("/admin/topics", { timeout: 10_000 })
        const topicRow = page.locator(".row.wrap.inline.g-1").filter({ hasText: topicId })
        const profileLink = topicRow.locator(".tag:has(.fa-address-card)")
        await expect(profileLink).toBeVisible({ timeout: 5_000 })
        await profileLink.click()
        await expect(page).toHaveURL(new RegExp(`/topic/${topicId}/tools/profile$`))
        await expect(page.getByRole("heading", { name: topicId, exact: true })).toBeVisible({ timeout: 5_000 })

        await page.goto(`/topic/${topicId}/tools/moderators`, { timeout: 10_000 })
        await expect(page).toHaveURL(new RegExp(`/topic/${topicId}/tools/moderators$`))

        await page.goto(`/topic/${topicId}`, { timeout: 10_000 })
        await expect(page.locator(".topic-tools > nav.tabstrip")).toHaveCount(0)
        const publicTools = page.locator("aside.sidebar")
        const profileButton = publicTools.locator("button").filter({ hasText: "Profile" })
        const moderatorsButton = publicTools.locator("button").filter({ hasText: "Moderators" })
        const reportsButton = publicTools.locator("button").filter({ hasText: "Reports" })
        await expect(profileButton).toBeVisible()
        await expect(moderatorsButton).toBeVisible()
        await expect(reportsButton).toBeVisible()
        await moderatorsButton.click()
        await expect(page).toHaveURL(new RegExp(`/topic/${topicId}/tools/moderators$`))

        await page.goto(`/topic/${topicId}/tools`, { timeout: 10_000 })
        await expect(page).toHaveURL(new RegExp(`/topic/${topicId}/tools/profile$`))

        await page.goto(`/topic/${topicId}/tools/moderators`, { timeout: 10_000 })
        await expect(page.getByRole("heading", { name: "Topic moderators", exact: true })).toBeVisible({ timeout: 5_000 })

        const tabs = page.locator(".topic-tools nav.tabstrip a")
        await expect(tabs).toHaveCount(4)
        await expect(tabs).toHaveText(["Back", "Profile", "Moderators", "Reports"])
        await expect(tabs.nth(0)).toHaveAttribute("href", `/topic/${topicId}`)
        await expect(tabs.nth(1)).toHaveAttribute("href", `/topic/${topicId}/tools/profile`)
        await expect(tabs.nth(2)).toHaveAttribute("href", `/topic/${topicId}/tools/moderators`)
        await expect(tabs.nth(3)).toHaveAttribute("href", `/topic/${topicId}/tools/reports`)
        await expect(page.getByLabel("Add Moderator")).toHaveCount(0)

        const moderatorRow = page.locator(".moderator-row").filter({ hasText: userName })
        await expect(moderatorRow).toBeVisible({ timeout: 5_000 })
        await moderatorRow.getByRole("button", { name: "Remove", exact: true }).click()
        await expect(moderatorRow).toHaveCount(0, { timeout: 5_000 })
    }
    finally {
        await page.request.post(apiUrl("/api/developer/database/query"), {
            headers: { Authorization: accessToken },
            data: {
                query: `
                    DELETE moderatorLog WHERE target = topic:${topicId};
                    DELETE topic:${topicId};
                    DELETE user:${userId};
                `,
            },
            timeout: 5_000,
        })
    }
})
