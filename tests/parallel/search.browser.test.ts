import { expect, test } from "../utils/browser-fixtures"
import { extractId } from "../../shared/utils/records"
import type { Post } from "../../shared/types"

const samplePostTitle = "Browser suite sample post"

test("finds the seeded post through the feed search UI", async ({ page }) => {
    await page.goto("/feed/search")

    const searchInput = page.getByRole("searchbox", { name: "Search..." })
    await searchInput.fill(samplePostTitle)
    await searchInput.press("Enter")

    await expect(page.locator(".feed-items").getByText(samplePostTitle, { exact: true })).toBeVisible()
})

test("keeps search filters in the URL and restores feed scroll when returning from a result", async ({ authenticatedPage: page, exampleServer }) => {
    const marker = `searchscroll${Date.now().toString(36)}`
    const topicId = `scrolltopic${Date.now().toString(36).replace(/\d/g, "a")}`
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    const postIds: string[] = []
    const exampleAuthors = Object.values(exampleServer.users).filter(author => author.user.name.startsWith("Example"))

    try {
        for (const [index, author] of exampleAuthors.entries()) {
            const response = await page.request.post(apiUrl("/api/post/add"), {
                headers: { Authorization: author.accessToken },
                data: {
                    title: `${marker} post ${index}`,
                    content: `Unique browser search marker ${marker}`,
                    topics: [`topic:${topicId}`],
                    images: [],
                },
            })
            if (!response.ok()) {
                throw new Error(`Failed to create a browser search post (${response.status()}): ${await response.text()}`)
            }
            const postId = extractId((await response.json() as Post).id)
            if (!postId) throw new Error("The browser search post did not return an ID.")
            postIds.push(postId)
        }

        const today = new Date().toISOString().slice(0, 10)
        await page.goto("/feed/search")
        const searchInput = page.getByRole("searchbox", { name: "Search..." })
        await searchInput.fill(marker)
        await page.getByLabel("Type").selectOption("post")
        await expect(page.getByLabel("Topic").locator(`option[value="${topicId}"]`)).toBeAttached()
        await page.getByLabel("Topic").selectOption(topicId)
        await page.getByLabel("Author").fill("Example")
        await page.getByLabel("From", { exact: true }).fill(today)
        await page.getByLabel("To", { exact: true }).fill(today)
        await page.getByRole("button", { name: "Search" }).click()

        await expect.poll(() => new URL(page.url()).searchParams.get("type")).toBe("post")
        await expect.poll(() => new URL(page.url()).searchParams.get("topic")).toBe(topicId)
        await expect.poll(() => new URL(page.url()).searchParams.get("user")).toBe("Example")
        await expect.poll(() => new URL(page.url()).searchParams.get("from")).toBe(today)
        await expect.poll(() => new URL(page.url()).searchParams.get("to")).toBe(today)
        await expect(page.locator(".feed-items .feed-item")).toHaveCount(postIds.length)
        const searchUrl = page.url()
        const scroller = page.locator("section.page")
        const previousScroll = await scroller.evaluate((element) => {
            const container = element as HTMLElement
            container.scrollTop = Math.min(500, container.scrollHeight - container.clientHeight)
            return container.scrollTop
        })
        expect(previousScroll).toBeGreaterThan(0)

        const visibleIndex = await page.locator(".post.clickable").evaluateAll((items) => {
            const container = document.querySelector<HTMLElement>("section.page")
            if (!container) return -1
            const bounds = container.getBoundingClientRect()
            return items.findIndex((item) => {
                const itemBounds = item.getBoundingClientRect()
                return itemBounds.top >= bounds.top && itemBounds.bottom <= bounds.bottom
            })
        })
        expect(visibleIndex).toBeGreaterThanOrEqual(0)
        await page.locator(".post.clickable").nth(visibleIndex).click()
        await expect(page).toHaveURL(/\/post\//)

        await page.goBack()
        await expect(page).toHaveURL(searchUrl)
        await expect(page.locator(".feed-items .feed-item")).toHaveCount(postIds.length)
        await expect.poll(() => scroller.evaluate(element => (element as HTMLElement).scrollTop)).toBe(previousScroll)

        await page.goForward()
        await expect(page).toHaveURL(/\/post\//)
        await page.goBack()
        await expect(page).toHaveURL(searchUrl)
        await expect.poll(() => scroller.evaluate(element => (element as HTMLElement).scrollTop)).toBe(previousScroll)

        await page.reload()
        await expect(page.getByRole("searchbox", { name: "Search..." })).toHaveValue(marker)
        await expect(page.getByLabel("Type")).toHaveValue("post")
        await expect(page.getByLabel("Author")).toHaveValue("Example")
        await expect(page.getByLabel("From", { exact: true })).toHaveValue(today)
        await expect(page.getByLabel("To", { exact: true })).toHaveValue(today)
        await expect(page.locator(".feed-items .feed-item")).toHaveCount(postIds.length)
    }
    finally {
        for (const postId of postIds) {
            const response = await page.request.get(apiUrl(`/api/post/${postId}/delete`), {
                headers: { Authorization: accessToken },
            })
            expect(response.ok()).toBe(true)
        }
    }
})