import type { Route } from "@playwright/test"
import { expect, test } from "../utils/browser-fixtures"

// test("animates vote changes only after interaction and respects reduced motion", async ({ authenticatedPage: page }) => {
//     const voteApi = (url: URL) => url.pathname.startsWith("/api/vote/")
//     const mockVote = async (route: Route) => {
//         await route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
//     }

//     await page.goto("/feed/posts")
//     const postPreview = page.locator(".post.clickable").filter({ hasText: "Browser suite sample post" })
//     await postPreview.locator(".main").click()
//     await expect(page).toHaveURL(/\/post\/[^/]+$/)
//     await page.addStyleTag({ content: ".vote-state-change { animation-duration: 800ms !important; }" })

//     const positive = page.locator("main header .tag.positive").first()
//     const misleading = page.locator("main header .tag.misleading").first()
//     const negative = page.locator("main header .tag.negative").first()
//     const postUrl = page.url()

//     try {
//         await expect(positive).toBeVisible()
//         await positive.click()
//         await expect(positive).toHaveClass(/voted/)
//         await expect(positive).toHaveClass(/vote-state-change/)
//         await expect(positive).not.toHaveClass(/vote-state-change/)

//         await page.reload()
//         // TODO need to account for SSR and client animation differences
//         await expect(positive).toHaveClass(/voted/)
//         await expect(positive).toHaveCSS("animation-name", "none")

//         await page.route(voteApi, mockVote)

//         for (const control of [positive, misleading, negative]) {
//             await expect(control).toBeVisible()
//             await expect(control).not.toHaveClass(/vote-state-change/)
//             await expect(control).toHaveCSS("animation-name", "none")

//             const selected = control !== positive
//             await control.click()
//             await expect(control).toHaveClass(/vote-state-change/)
//             await expect(control).toHaveCSS("animation-name", "vote-state-change")
//             if (selected) await expect(control).toHaveClass(/voted/)
//             else await expect(control).not.toHaveClass(/voted/)
//             await expect(control).not.toHaveClass(/vote-state-change/)
//         }

//         await positive.click()
//         await expect(positive).toHaveClass(/vote-state-change/)
//         await expect(positive).toHaveClass(/voted/)
//         await expect(positive).not.toHaveClass(/vote-state-change/)

//         await page.emulateMedia({ reducedMotion: "reduce" })
//         await positive.click()
//         await expect(positive).not.toHaveClass(/vote-state-change/)
//         await expect(positive).not.toHaveClass(/voted/)
//         await positive.click()
//         await expect(positive).not.toHaveClass(/vote-state-change/)
//         await expect(positive).toHaveClass(/voted/)
//     }
//     finally {
//         await page.unroute(voteApi, mockVote)
//         await page.goto(postUrl)
//         if (await positive.evaluate(element => element.classList.contains("voted"))) {
//             await positive.click()
//             await expect(positive).not.toHaveClass(/voted/)
//         }
//     }
// })