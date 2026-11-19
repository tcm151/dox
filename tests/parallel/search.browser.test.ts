import { expect, test } from "../utils/browser-fixtures"
import { extractId } from "../../shared/utils/records"
import type { Link, Post } from "../../shared/types"

const samplePostTitle = "Browser suite sample post"

test("finds the seeded post through the feed search UI", async ({ page }) => {
    await page.goto("/feed/search")

    const searchInput = page.getByRole("searchbox", { name: "Search..." })
    await searchInput.fill(samplePostTitle)
    await searchInput.press("Enter")

    await expect(page.locator(".feed-items").getByText(samplePostTitle, { exact: true })).toBeVisible()
})

test("shows a delayed initial search failure and allows retry", async ({ authenticatedPage: page }) => {
    let attempts = 0
    let signalFirstRequest = () => {}
    let releaseFirstResponse = () => {}
    const firstRequestStarted = new Promise<void>(resolve => { signalFirstRequest = resolve })
    const firstResponseGate = new Promise<void>(resolve => { releaseFirstResponse = resolve })

    await page.route(url => url.pathname === "/api/feed/search", async (route) => {
        attempts++
        if (attempts === 1) {
            signalFirstRequest()
            await firstResponseGate
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                headers: { "x-request-id": "feed-search-initial-failure" },
                body: JSON.stringify({ statusCode: 400, statusMessage: "Simulated search failure" }),
            })
            return
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ items: [], pageSize: 20, offset: 0, more: false }),
        })
    })

    try {
        await page.locator("nav.tabstrip").getByRole("link", { name: "Search" }).click()
        await firstRequestStarted
        await expect(page.locator(".feed-items").getByRole("status")).toHaveText("Loading feed...")
        await expect(page.locator(".feed-items").getByText("There is nothing here currently.")).toHaveCount(0)

        releaseFirstResponse()
        const errorState = page.locator(".feed-items").getByRole("alert")
        await expect(errorState).toContainText("Unable to load this feed.")
        await expect(errorState.getByRole("button", { name: "Retry" })).toBeVisible()
        await expect(page.locator(".hint.danger")).toBeVisible()

        await errorState.getByRole("button", { name: "Retry" }).click()
        await expect(page.getByText("There is nothing here currently.", { exact: true })).toBeVisible()
        expect(attempts).toBe(2)
    }
    finally {
        releaseFirstResponse()
    }
})

test("searches links and all types with collapsed advanced filters and URL history", async ({ authenticatedPage: page }) => {
    const marker = `searchlink${Date.now().toString(36)}`
    const topicId = `searchlink${Date.now().toString(36).replace(/\d/g, "a")}`
    const postTopicId = `searchpost${Date.now().toString(36).replace(/\d/g, "a")}`
    const accessToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const apiUrl = (path: string) => new URL(path, page.url()).toString()
    let postId: string | undefined
    let linkId: string | undefined

    try {
        const postResponse = await page.request.post(apiUrl("/api/post/add"), {
            headers: { Authorization: accessToken },
            data: {
                title: `${marker} post`,
                content: `Unique browser search marker ${marker}`,
                topics: [`topic:${postTopicId}`],
                images: [],
            },
        })
        if (!postResponse.ok()) {
            throw new Error(`Failed to create a browser search post (${postResponse.status()}): ${await postResponse.text()}`)
        }
        postId = extractId((await postResponse.json() as Post).id)
        if (!postId) throw new Error("The browser search post did not return an ID.")

        const linkResponse = await page.request.post(apiUrl("/api/link/add"), {
            headers: { Authorization: accessToken },
            data: {
                title: `${marker} link`,
                description: `Unique link description ${marker}`,
                url: "http://127.0.0.1/search-link-test",
                topics: [`topic:${topicId}`],
            },
        })
        if (!linkResponse.ok()) {
            throw new Error(`Failed to create a browser search link (${linkResponse.status()}): ${await linkResponse.text()}`)
        }
        linkId = extractId((await linkResponse.json() as Link).id)
        if (!linkId) throw new Error("The browser search link did not return an ID.")

        const today = new Date().toISOString().slice(0, 10)
        await page.goto("/feed/search")
        const advancedFilters = page.locator(".field.row > button").last()
        await expect(advancedFilters).toHaveAttribute("aria-expanded", "false")
        await expect(page.getByLabel("Type")).toBeHidden()
        await advancedFilters.click()
        await expect(advancedFilters).toHaveAttribute("aria-expanded", "true")

        await page.getByRole("searchbox", { name: "Search..." }).fill(marker)
        await page.getByLabel("Type").selectOption("link")
        await expect(page.getByLabel("Topic").locator(`option[value="${topicId}"]`)).toBeAttached()
        await page.getByLabel("Topic").selectOption(topicId)
        await page.getByLabel("Author").fill("TestAdmin")
        await page.getByLabel("From", { exact: true }).fill(today)
        await page.getByLabel("To", { exact: true }).fill(today)
        await page.getByRole("button", { name: "Search" }).click()

        await expect.poll(() => new URL(page.url()).searchParams.get("type")).toBe("link")
        await expect.poll(() => new URL(page.url()).searchParams.get("topic")).toBe(topicId)
        await expect.poll(() => new URL(page.url()).searchParams.get("user")).toBe("TestAdmin")
        await expect.poll(() => new URL(page.url()).searchParams.get("from")).toBe(today)
        await expect.poll(() => new URL(page.url()).searchParams.get("to")).toBe(today)
        await expect(page.locator(".feed-items .link-preview")).toHaveCount(1)
        await expect(page.locator(".feed-items").getByText(`${marker} link`, { exact: true })).toBeVisible()
        await expect(page.locator(".feed-items .post.clickable")).toHaveCount(0)
        const linkSearchUrl = page.url()

        await page.getByLabel("Type").selectOption("")
        await page.getByLabel("Topic").selectOption("")
        await page.getByRole("button", { name: "Search" }).click()
        await expect.poll(() => new URL(page.url()).searchParams.has("type")).toBe(false)
        await expect.poll(() => new URL(page.url()).searchParams.has("topic")).toBe(false)
        await expect(page.locator(".feed-items .link-preview")).toHaveCount(1)
        await expect(page.locator(".feed-items .post.clickable")).toHaveCount(1)
        const allTypesUrl = page.url()

        await page.goBack()
        await expect(page).toHaveURL(linkSearchUrl)
        await expect(page.getByLabel("Type")).toHaveValue("link")
        await expect(page.locator(".feed-items .link-preview")).toHaveCount(1)

        await page.goForward()
        await expect(page).toHaveURL(allTypesUrl)
        await expect(page.getByLabel("Type")).toHaveValue("")
        await expect(page.locator(".feed-items .link-preview")).toHaveCount(1)
        await expect(page.locator(".feed-items .post.clickable")).toHaveCount(1)

        await page.goBack()
        await expect(page).toHaveURL(linkSearchUrl)
        await page.reload()
        await expect(advancedFilters).toHaveAttribute("aria-expanded", "false")
        await expect(page.getByLabel("Type")).toBeHidden()
        await advancedFilters.click()
        await expect(page.getByLabel("Type")).toHaveValue("link")
        await expect(page.locator(".feed-items .link-preview")).toHaveCount(1)
    }
    finally {
        if (linkId) {
            const response = await page.request.get(apiUrl(`/api/link/${linkId}/delete`), {
                headers: { Authorization: accessToken },
            })
            expect(response.ok()).toBe(true)
        }
        if (postId) {
            const response = await page.request.get(apiUrl(`/api/post/${postId}/delete`), {
                headers: { Authorization: accessToken },
            })
            expect(response.ok()).toBe(true)
        }
    }
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
            const advancedFilters = page.locator(".field.row > button").last()
            await expect(advancedFilters).toHaveAttribute("aria-expanded", "false")
            await advancedFilters.click()
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
        const scrollerBounds = await scroller.boundingBox()
        if (!scrollerBounds) throw new Error("The feed scroller has no visible bounds.")
        await page.mouse.move(
            scrollerBounds.x + scrollerBounds.width / 2,
            scrollerBounds.y + scrollerBounds.height / 2,
        )
        await page.mouse.wheel(0, 500)
        await expect.poll(() => scroller.evaluate(element => (element as HTMLElement).scrollTop)).toBeGreaterThan(0)
        const previousScroll = await scroller.evaluate(element => (element as HTMLElement).scrollTop)
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
        await expect(page.locator("section.post")).toBeVisible()
        await expect(page.locator(".swap-enter-active")).toHaveCount(0)

        await page.goBack()
        await expect(page).toHaveURL(searchUrl)
        await expect(page.locator(".feed-items .feed-item")).toHaveCount(postIds.length)
        await expect(page.locator(".feed-enter-active")).toHaveCount(0)
        await expect.poll(() => scroller.evaluate(element => (element as HTMLElement).scrollTop)).toBe(previousScroll)

        await page.goForward()
        await expect(page).toHaveURL(/\/post\//)
        await expect(page.locator("section.post")).toBeVisible()
        await expect(page.locator(".swap-enter-active")).toHaveCount(0)
        await page.goBack()
        await expect(page).toHaveURL(searchUrl)
        await expect(page.locator(".feed-items .feed-item")).toHaveCount(postIds.length)
        await expect(page.locator(".feed-enter-active")).toHaveCount(0)
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