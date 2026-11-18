import type { FeedPage, Gallery } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expect, test } from "../utils/browser-fixtures"

test("hides gallery options from guests", async ({ page, request }) => {
    const response = await request.get("/api/gallery")
    expect(response.ok()).toBe(true)
    const galleries = (await response.json() as FeedPage<Gallery>).items
    const gallery = galleries.find(item => item.images.some(image => image.id === "image:browserSuiteSampleGallery"))
    expect(gallery).toBeDefined()

    await page.goto(`/gallery/${extractId(gallery!.id)}`)
    await expect(page.locator("main.gallery")).toBeVisible()
    await expect(page.getByRole("button", { name: "Options" })).toHaveCount(0)
})

test("shows gallery edit and hides self-award actions from its owner", async ({ authenticatedPage, request }) => {
    const response = await request.get("/api/gallery")
    expect(response.ok()).toBe(true)
    const galleries = (await response.json() as FeedPage<Gallery>).items
    const gallery = galleries.find(item => item.images.some(image => image.id === "image:browserSuiteSampleGallery"))
    expect(gallery).toBeDefined()

    await authenticatedPage.goto(`/gallery/${extractId(gallery!.id)}`)
    await expect(authenticatedPage.locator("main.gallery")).toBeVisible()
    await authenticatedPage.locator('button.options[title="Options"]').click()
    const options = authenticatedPage.locator("main.window").filter({
        has: authenticatedPage.getByRole("heading", { name: "Options" }),
    })
    await expect(options.getByRole("button", { name: "Edit" })).toBeVisible()
    await expect(options.getByRole("button", { name: "Award" })).toHaveCount(0)
    await options.getByRole("button", { name: "Edit" }).click()

    await expect(authenticatedPage.locator("main.gallery textarea")).toBeVisible()
    await authenticatedPage.getByRole("button", { name: "Cancel" }).click()
    await expect(authenticatedPage.locator("main.gallery textarea")).toHaveCount(0)
})