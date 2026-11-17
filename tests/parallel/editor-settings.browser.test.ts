import type { AppSettings } from "../../shared/types"
import { expect, test } from "../utils/browser-fixtures"

test("blocks direct post and thread editor routes when publishing is disabled", async ({ authenticatedPage: page }) => {
    await page.route("**/api/settings/default", async (route) => {
        const response = await route.fetch()
        const settings = await response.json() as AppSettings
        await route.fulfill({
            response,
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
