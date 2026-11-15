import { expect, test } from "../utils/browser-fixtures"
import type { Page } from "@playwright/test"
import { extractId } from "../../shared/utils/records"

const adminName = process.env.CLASSICFORUM_TEST_ADMIN_NAME!
const adminPassword = process.env.CLASSICFORUM_TEST_ADMIN_PASSWORD!

type NotificationFixture = {
    marker: string
    parentId?: string
    replyId?: string
}

function apiUrl(page: Page, path: string) {
    return new URL(path, page.url()).toString()
}

async function createNotification(
    page: Page,
    recipientToken: string,
    replyToken: string,
    fixture: NotificationFixture,
) {
    const parentResponse = await page.request.post(apiUrl(page, "/api/thread/add"), {
        headers: { Authorization: recipientToken },
        data: { content: `Account switch parent ${fixture.marker}`, topics: [], images: [] },
    })
    expect(parentResponse.ok()).toBe(true)
    const parent = await parentResponse.json() as { id: string }
    fixture.parentId = extractId(parent.id)

    const replyResponse = await page.request.post(apiUrl(page, `/api/thread/${fixture.parentId}/reply`), {
        headers: { Authorization: replyToken },
        data: { content: fixture.marker },
    })
    expect(replyResponse.ok()).toBe(true)
    const reply = await replyResponse.json() as { id: string }
    fixture.replyId = extractId(reply.id)
}

async function cleanupNotifications(page: Page, accessToken: string, fixtures: NotificationFixture[]) {
    const statements = fixtures.flatMap((fixture) => [
        ...(fixture.replyId
            ? [`DELETE notification WHERE context = thread:${fixture.replyId};`, `DELETE thread:${fixture.replyId};`]
            : []),
        ...(fixture.parentId ? [`DELETE thread:${fixture.parentId};`] : []),
    ])
    if (statements.length === 0) return

    const response = await page.request.post(apiUrl(page, "/api/developer/database/query"), {
        headers: { Authorization: accessToken },
        data: { query: statements.join("\n") },
    })
    expect(response.ok()).toBe(true)
}

test("switches to a saved profile without reloading or changing the route", async ({ page, exampleServer }) => {
    const profile = exampleServer.users.threadAuthor

    await page.addInitScript((savedProfiles) => {
        localStorage.setItem("profiles", JSON.stringify(savedProfiles))
        const documentLoads = Number(sessionStorage.getItem("test-document-loads") ?? "0")
        sessionStorage.setItem("test-document-loads", String(documentLoads + 1))
    }, [{
        id: profile.user.id,
        name: profile.user.name,
        token: profile.accessToken,
    }])
    await page.goto("/feed/home")

    await page.locator("nav").getByText("Login", { exact: true }).click()
    await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await page.getByText("New Login", { exact: true }).click()
    await page.locator("main.form input[type='text']").fill(adminName)
    await page.locator("main.form input[type='password']").fill(adminPassword)
    await page.getByRole("button", { name: "Login", exact: true }).click()
    await expect(page.locator("nav").getByText(adminName, { exact: true })).toBeVisible()
    await page.evaluate(() => sessionStorage.setItem("test-document-loads", "0"))
    await page.goto("/feed/home")
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()

    await page.locator("nav").getByRole("link", { name: new RegExp(adminName) }).click({ button: "right" })
    await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await page.locator("main.window").getByRole("button", { name: profile.user.name }).click()
    await expect(page.locator("nav").getByText(profile.user.name, { exact: true })).toBeVisible()
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    await expect(page.getByText("Browser suite sample post", { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/feed\/home$/)
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("test-document-loads"))).toBe("1")
})

test("refreshes inbox data when switching accounts", async ({ authenticatedPage: page, exampleServer }) => {
    const adminToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const profile = exampleServer.users.threadAuthor
    const replyAuthor = exampleServer.users.commentAuthor
    const suffix = Date.now()
    const adminNotification = { marker: `Account switch admin ${suffix}` }
    const profileNotification = { marker: `Account switch profile ${suffix}` }
    const fixtures = [adminNotification, profileNotification]

    try {
        await createNotification(page, adminToken, replyAuthor.accessToken, adminNotification)
        await createNotification(page, profile.accessToken, replyAuthor.accessToken, profileNotification)
        await page.evaluate((savedProfiles) => {
            localStorage.setItem("profiles", JSON.stringify(savedProfiles))
            sessionStorage.setItem("test-document-loads", "0")
        }, [{
            id: profile.user.id,
            name: profile.user.name,
            token: profile.accessToken,
        }])
        await page.addInitScript(() => {
            const documentLoads = Number(sessionStorage.getItem("test-document-loads") ?? "0")
            sessionStorage.setItem("test-document-loads", String(documentLoads + 1))
        })
        await page.goto("/inbox")

        await expect(page.getByText(adminNotification.marker, { exact: false })).toBeVisible()
        await expect(page.getByText(profileNotification.marker, { exact: false })).toHaveCount(0)
        await page.locator("nav").getByRole("link", { name: new RegExp(adminName) }).click({ button: "right" })
        await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
        await page.locator("main.window").getByRole("button", { name: profile.user.name }).click()

        await expect(page.locator("nav").getByText(profile.user.name, { exact: true })).toBeVisible()
        await expect(page.getByText(profileNotification.marker, { exact: false })).toBeVisible()
        await expect(page.getByText(adminNotification.marker, { exact: false })).toHaveCount(0)
        await expect(page).toHaveURL(/\/inbox$/)
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem("test-document-loads"))).toBe("1")
    }
    finally {
        await cleanupNotifications(page, adminToken, fixtures)
    }
})

test("clears previous inbox data when the account refresh fails", async ({ authenticatedPage: page, exampleServer }) => {
    const adminToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const profile = exampleServer.users.threadAuthor
    const replyAuthor = exampleServer.users.commentAuthor
    const suffix = Date.now()
    const adminNotification = { marker: `Account switch failed admin ${suffix}` }
    const profileNotification = { marker: `Account switch failed profile ${suffix}` }
    const fixtures = [adminNotification, profileNotification]
    let releaseFailure = () => {}
    let refreshIntercepted = false
    let failedStatus: number | undefined
    const failureGate = new Promise<void>((resolve) => {
        releaseFailure = resolve
    })

    try {
        await createNotification(page, adminToken, replyAuthor.accessToken, adminNotification)
        await createNotification(page, profile.accessToken, replyAuthor.accessToken, profileNotification)
        await page.evaluate((savedProfiles) => {
            localStorage.setItem("profiles", JSON.stringify(savedProfiles))
        }, [{
            id: profile.user.id,
            name: profile.user.name,
            token: profile.accessToken,
        }])
        await page.goto("/inbox")
        await expect(page.getByText(adminNotification.marker, { exact: false })).toBeVisible()

        await page.route((url) => url.pathname === "/api/profile/notifications", async (route) => {
            refreshIntercepted = true
            await failureGate
            await route.fulfill({
                status: 503,
                contentType: "application/json",
                body: JSON.stringify({ statusCode: 503, statusMessage: "Simulated inbox refresh failure" }),
            })
            failedStatus = 503
        })
        await page.locator("nav").getByRole("link", { name: new RegExp(adminName) }).click({ button: "right" })
        await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
        await page.locator("main.window").getByRole("button", { name: profile.user.name }).click()

        await expect.poll(() => refreshIntercepted).toBe(true)
        await expect(page.getByText(adminNotification.marker, { exact: false })).toHaveCount(0)
        releaseFailure()
        await expect.poll(() => failedStatus).toBe(503)
        await expect(page.getByText(adminNotification.marker, { exact: false })).toHaveCount(0)
        await expect(page.getByText(profileNotification.marker, { exact: false })).toHaveCount(0)
        await expect(page.locator("nav").getByText(profile.user.name, { exact: true })).toBeVisible()
        await expect(page).toHaveURL(/\/inbox$/)
    }
    finally {
        releaseFailure()
        await cleanupNotifications(page, adminToken, fixtures)
    }
})

test("updates registration validation as fields change", async ({ page }) => {
    await page.goto("/register")

    const form = page.locator("article .form")
    const emailField = form.locator(".field").filter({ hasText: "Email" })
    const usernameField = form.locator(".field").filter({ hasText: "Username" })
    const passwordFields = form.locator(".field:has(input[type='password'])")

    await emailField.locator("input").fill("not-an-email")
    await expect(emailField).toHaveClass(/invalid/)
    await emailField.locator("input").fill("reader@example.invalid")
    await expect(emailField).not.toHaveClass(/invalid/)

    await usernameField.locator("input").fill("ab")
    await expect(usernameField).toHaveClass(/invalid/)

    await passwordFields.nth(0).locator("input").fill("valid-password")
    await passwordFields.nth(1).locator("input").fill("different-password")
    await expect(passwordFields.nth(1)).toHaveClass(/invalid/)
})