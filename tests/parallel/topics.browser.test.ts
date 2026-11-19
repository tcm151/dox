import { expect, test } from "../utils/browser-fixtures"
import { extractId } from "../../shared/utils/records"

test("refreshes topic follower counts after following and unfollowing from the topics feed", async ({ authenticatedPage: page }) => {
    const topicId = `topicFollowCountBrowser${Date.now()}`
    let postId: string | undefined
    const accessToken = await page.evaluate(() => {
        const tokens = JSON.parse(localStorage.getItem("tokens") ?? "{}")
        return tokens.access as string
    })
    const apiUrl = (path: string) => new URL(path, page.url()).toString()

    try {
        const postResponse = await page.request.post(apiUrl("/api/post/add"), {
            headers: { Authorization: accessToken },
            data: {
                title: `Topic follow count browser ${Date.now()}`,
                content: "Topic follow count refresh browser test.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expect(postResponse.ok()).toBe(true)
        const post = await postResponse.json() as { id: string }
        postId = extractId(post.id)

        await page.goto("/feed/topics", { timeout: 10_000 })
        const topicPreview = page.locator("main.box").filter({ hasText: topicId })
        const followerCount = topicPreview.locator(".tag.info").filter({ hasText: "followers" })
        await expect(topicPreview).toBeVisible()
        await expect(followerCount).toContainText("0 followers")

        await topicPreview.getByRole("button", { name: "Follow", exact: true }).click()
        await expect(topicPreview.getByRole("button", { name: "Unfollow", exact: true })).toBeVisible()
        await expect(followerCount).toContainText("1 followers")

        await topicPreview.getByRole("button", { name: "Unfollow", exact: true }).click()
        await expect(topicPreview.getByRole("button", { name: "Follow", exact: true })).toBeVisible()
        await expect(followerCount).toContainText("0 followers")
    }
    finally {
        await page.request.post(apiUrl("/api/developer/database/query"), {
            headers: { Authorization: accessToken },
            data: { query: `${postId ? `DELETE post:${postId};` : ""} DELETE topic:${topicId};` },
            timeout: 5_000,
        })
    }
})

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
        await expect(profileButton).toBeVisible()
        await page.setViewportSize({ width: 500, height: 800 })
        await expect(publicTools).toBeHidden()
        await page.setViewportSize({ width: 800, height: 800 })
        await expect(publicTools).toBeVisible()

        await page.goto(`/topic/${topicId}/tools`, { timeout: 10_000 })
        await expect(page).toHaveURL(new RegExp(`/topic/${topicId}/tools/profile$`))

        await page.goto(`/topic/${topicId}/tools/moderators`, { timeout: 10_000 })
        await expect(page.getByRole("heading", { name: "Topic moderators", exact: true })).toBeVisible({ timeout: 5_000 })

        const tabs = page.locator(".topic-tools nav.tabstrip a")
        await expect(tabs).toHaveCount(5)
        await expect(tabs).toHaveText(["Back", "Profile", "Moderators", "Pins", "Reports"])
        await expect(tabs.nth(0)).toHaveAttribute("href", `/topic/${topicId}`)
        await expect(tabs.nth(1)).toHaveAttribute("href", `/topic/${topicId}/tools/profile`)
        await expect(tabs.nth(2)).toHaveAttribute("href", `/topic/${topicId}/tools/moderators`)
        await expect(tabs.nth(3)).toHaveAttribute("href", `/topic/${topicId}/tools/pins`)
        await expect(tabs.nth(4)).toHaveAttribute("href", `/topic/${topicId}/tools/reports`)
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

test("topic pins are created from Extra Options and managed from topic tools", async ({ authenticatedPage: page }) => {
    const topicId = `topicPinBrowser${Date.now()}`
    let postId: string | undefined
    page.setDefaultTimeout(5_000)
    page.setDefaultNavigationTimeout(10_000)
    const accessToken = await page.evaluate(() => {
        const tokens = JSON.parse(localStorage.getItem("tokens") ?? "{}")
        return tokens.access as string
    })
    const apiUrl = (path: string) => new URL(path, page.url()).toString()

    try {
        const postResponse = await page.request.post(apiUrl("/api/post/add"), {
            headers: { Authorization: accessToken },
            data: {
                title: `Topic pin browser ${Date.now()}`,
                content: "A disposable topic pin workflow fixture.",
                topics: [`topic:${topicId}`],
                images: [],
            },
        })
        expect(postResponse.ok()).toBe(true)
        const post = await postResponse.json() as { id: string, title: string }
        postId = extractId(post.id)

        await page.goto(`/post/${postId}`, { timeout: 10_000 })
        const sessionUserName = await page.evaluate(() => JSON.parse(sessionStorage.getItem("user") ?? "{}").name as string)
        await expect(page.locator("nav").getByText(sessionUserName, { exact: true })).toBeVisible()
        await expect(page.locator("section.post h1")).toHaveText(post.title)
        await page.locator("section.post button.options").click()
        await expect(page.getByRole("heading", { name: "Options" })).toBeVisible()
        await expect(page.locator("main.window button").filter({ hasText: "Pin" })).toBeVisible()
        await page.locator("main.window button").filter({ hasText: "Pin" }).click()
        await page.locator("main.window button").filter({ hasText: topicId }).click()
        await expect(page.getByText("Content pinned to topic.", { exact: true })).toBeVisible()

        await page.goto(`/topic/${topicId}`, { timeout: 10_000 })
        const featuredPost = page.locator(".post.pinned").filter({ hasText: post.title })
        await expect(featuredPost).toBeVisible()
        await expect(featuredPost.locator(".meta .fa-thumbtack")).toBeVisible()

        await page.goto(`/topic/${topicId}/tools/pins`, { timeout: 10_000 })
        const activeToggle = page.locator("label.toggle input[type='checkbox']")
        const toggleActive = async (checked: boolean) => {
            const pinsRefresh = page.waitForResponse(response =>
                response.request().method() === "GET"
                && new URL(response.url()).pathname === `/api/topic/${topicId}/pins/manage`,
            )
            await page.locator("label.toggle").click()
            expect((await pinsRefresh).ok()).toBe(true)
            await expect(activeToggle).toBeChecked({ checked })
        }
        await expect(activeToggle).toBeChecked()
        await toggleActive(false)
        await toggleActive(true)

        await page.getByText("Remove", { exact: true }).click()
        await expect(page.getByText("There are currently no pins.", { exact: true })).toBeVisible()

        await page.goto(`/topic/${topicId}`, { timeout: 10_000 })
        await expect(page.getByRole("heading", { name: "Featured", exact: true })).toHaveCount(0)
    }
    finally {
        if (postId) {
            const pinsResponse = await page.request.get(apiUrl(`/api/topic/${topicId}/pins/manage`), {
                headers: { Authorization: accessToken },
                timeout: 5_000,
            })
            if (pinsResponse.ok()) {
                const pins = await pinsResponse.json() as { id: string }[]
                for (const pin of pins) {
                    await page.request.post(apiUrl(`/api/topic/${topicId}/pins/${extractId(pin.id)}/delete`), {
                        headers: { Authorization: accessToken },
                        timeout: 5_000,
                    })
                }
            }
            await page.request.get(apiUrl(`/api/post/${postId}/delete`), {
                headers: { Authorization: accessToken },
                timeout: 5_000,
            })
        }
    }
})
