import { expect, test } from "../utils/browser-fixtures"
import type { Page } from "@playwright/test"
import { extractId } from "../../shared/utils/records"
import type { Profile, UserSettings } from "../../shared/types"

const adminName = process.env.CLASSICFORUM_TEST_ADMIN_NAME!
const adminPassword = process.env.CLASSICFORUM_TEST_ADMIN_PASSWORD!

type NotificationFixture = {
    marker: string
    parentId?: string
    replyId?: string
}

function deferred() {
    let release!: () => void
    const promise = new Promise<void>((resolve) => {
        release = resolve
    })
    return { promise, release }
}

function apiUrl(page: Page, path: string) {
    return new URL(path, page.url()).toString()
}

async function getUserSettings(page: Page, token: string): Promise<UserSettings> {
    const response = await page.request.get(apiUrl(page, "/api/profile/settings"), {
        headers: { Authorization: token },
    })
    expect(response.ok()).toBe(true)
    return await response.json() as UserSettings
}

async function updateUserSettings(page: Page, token: string, settings: UserSettings): Promise<UserSettings> {
    const response = await page.request.put(apiUrl(page, "/api/profile/settings/update"), {
        headers: { Authorization: token },
        data: settings,
    })
    expect(response.ok()).toBe(true)
    return await response.json() as UserSettings
}

function waitForSettingsResponse(page: Page, token: string, method: "GET" | "PUT") {
    const path = method === "GET" ? "/api/profile/settings" : "/api/profile/settings/update"
    return page.waitForResponse(response =>
        new URL(response.url()).pathname === path
        && response.request().method() === method
        && response.request().headers()["authorization"] === token,
    )
}

async function switchSavedProfile(page: Page, currentName: string, targetName: string) {
    await page.locator("nav").getByText(currentName, { exact: true }).click({ button: "right" })
    await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
    await page.locator("main.window").getByRole("button", { name: targetName, exact: true }).click()
    await expect(page.locator("nav").getByText(targetName, { exact: true })).toBeVisible()
}

async function expectPreferenceView(page: Page, settings: UserSettings) {
    const inApp = page.locator("section.box .field.row").filter({ hasText: "in app notifications" })
    const email = page.locator("section.box .field.row").filter({ hasText: "email notifications" })
    if (settings.notifications.inApp) await expect(inApp.locator("input[type='checkbox']")).toBeChecked()
    else await expect(inApp.locator("input[type='checkbox']")).not.toBeChecked()
    if (settings.notifications.email) await expect(email.locator("input[type='checkbox']")).toBeChecked()
    else await expect(email.locator("input[type='checkbox']")).not.toBeChecked()
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

test("keeps preference responses and saves scoped to the active profile", async ({ authenticatedPage: page, exampleServer }) => {
    test.setTimeout(60_000)
    const adminToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const adminUser = await page.evaluate(() => JSON.parse(sessionStorage.getItem("user") ?? "{}")) as Profile
    const profile = exampleServer.users.threadAuthor
    const adminSettings = await getUserSettings(page, adminToken)
    const originalProfileSettings = await getUserSettings(page, profile.accessToken)
    const profileSettings = await updateUserSettings(page, profile.accessToken, {
        ...originalProfileSettings,
        privacy: {
            ...originalProfileSettings.privacy,
            profile: adminSettings.privacy.profile === "private" ? "members" : "private",
        },
        notifications: {
            inApp: !adminSettings.notifications.inApp,
            email: !adminSettings.notifications.email,
        },
    })
    const firstAdminGate = deferred()
    const firstProfileGate = deferred()
    let adminGate: typeof firstAdminGate | undefined = firstAdminGate
    let profileGate: typeof firstProfileGate | undefined = firstProfileGate
    let fulfillAdminGate = false
    let adminReadsHeld = 0
    let profileReadsHeld = 0
    let profileSavesHeld = 0
    let profileSaveGate: ReturnType<typeof deferred> | undefined
    const delayedProfileRefreshGate = deferred()
    const delayedProfileSaveGate = deferred()
    const delayedLogoutRefreshGate = deferred()
    let testError: unknown
    let hasTestError = false

    try {
        await page.evaluate(({ adminUser, adminToken, profile }) => {
            sessionStorage.setItem("authenticated", JSON.stringify(true))
            sessionStorage.setItem("user", JSON.stringify(adminUser))
            localStorage.setItem("tokens", JSON.stringify({ access: adminToken }))
            localStorage.setItem("profiles", JSON.stringify([
                { id: adminUser.id, name: adminUser.name, token: adminToken },
                { id: profile.user.id, name: profile.user.name, token: profile.accessToken },
            ]))
        }, { adminUser, adminToken, profile })

        await page.route(url => new URL(url).pathname.startsWith("/api/profile/settings"), async (route) => {
            const request = route.request()
            const token = request.headers()["authorization"]
            if (request.method() === "GET" && token === adminToken && adminGate) {
                const gate = adminGate
                adminGate = undefined
                adminReadsHeld++
                await gate.promise
                if (fulfillAdminGate) {
                    await route.fulfill({
                        status: 200,
                        contentType: "application/json",
                        body: JSON.stringify(adminSettings),
                    })
                }
                else {
                    await route.continue()
                }
                return
            }
            if (request.method() === "GET" && token === profile.accessToken && profileGate) {
                const gate = profileGate
                profileGate = undefined
                profileReadsHeld++
                await gate.promise
                await route.continue()
                return
            }
            if (request.method() === "PUT" && token === profile.accessToken && profileSaveGate) {
                const gate = profileSaveGate
                profileSaveGate = undefined
                profileSavesHeld++
                await gate.promise
                await route.continue()
                return
            }
            await route.continue()
        })

        await page.goto("/profile/preferences")
        await expect.poll(() => adminReadsHeld).toBe(1)
        await switchSavedProfile(page, adminUser.name, profile.user.name)
        await expect.poll(() => profileReadsHeld).toBe(1)

        const firstAdminResponse = waitForSettingsResponse(page, adminToken, "GET")
        firstAdminGate.release()
        expect((await firstAdminResponse).ok()).toBe(true)

        const firstProfileResponse = waitForSettingsResponse(page, profile.accessToken, "GET")
        firstProfileGate.release()
        const profileResponse = await firstProfileResponse
        expect(profileResponse.ok()).toBe(true)
        expect((await profileResponse.json() as UserSettings).notifications).toEqual(profileSettings.notifications)
        await expectPreferenceView(page, profileSettings)

        const profileSaveResponse = waitForSettingsResponse(page, profile.accessToken, "PUT")
        await page.getByRole("button", { name: "Save" }).click()
        expect((await profileSaveResponse).ok()).toBe(true)
        expect((await getUserSettings(page, adminToken)).privacy.profile).toBe(adminSettings.privacy.profile)
        expect((await getUserSettings(page, profile.accessToken)).privacy.profile).toBe(profileSettings.privacy.profile)

        profileGate = delayedProfileRefreshGate
        await page.getByRole("button", { name: "Cancel" }).click()
        await expect.poll(() => profileReadsHeld).toBe(2)
        await switchSavedProfile(page, profile.user.name, adminUser.name)
        await expectPreferenceView(page, adminSettings)
        const delayedProfileResponse = waitForSettingsResponse(page, profile.accessToken, "GET")
        delayedProfileRefreshGate.release()
        expect((await delayedProfileResponse).ok()).toBe(true)
        await expectPreferenceView(page, adminSettings)

        await switchSavedProfile(page, adminUser.name, profile.user.name)
        await expectPreferenceView(page, profileSettings)
        profileSaveGate = delayedProfileSaveGate
        const inApp = page.locator("section.box .field.row").filter({ hasText: "in app notifications" })
        await inApp.locator("label.toggle").click()
        const profileSaveInFlight = waitForSettingsResponse(page, profile.accessToken, "PUT")
        await page.getByRole("button", { name: "Save" }).click()
        await expect.poll(() => profileSavesHeld).toBe(1)
        await switchSavedProfile(page, profile.user.name, adminUser.name)
        await expectPreferenceView(page, adminSettings)
        delayedProfileSaveGate.release()
        expect((await profileSaveInFlight).ok()).toBe(true)
        await expectPreferenceView(page, adminSettings)

        const savedProfileSettings = await getUserSettings(page, profile.accessToken)
        expect(savedProfileSettings.notifications.inApp).toBe(!profileSettings.notifications.inApp)
        expect((await getUserSettings(page, adminToken)).privacy.profile).toBe(adminSettings.privacy.profile)

        adminGate = delayedLogoutRefreshGate
        fulfillAdminGate = true
        await page.getByRole("button", { name: "Cancel" }).click()
        await expect.poll(() => adminReadsHeld).toBe(2)
        await page.locator("nav button[title='Logout']").dispatchEvent("contextmenu", { button: 2 })
        await expect(page.locator("nav").getByText("Login", { exact: true })).toBeVisible()
        const lateLogoutResponse = waitForSettingsResponse(page, adminToken, "GET")
        delayedLogoutRefreshGate.release()
        expect((await lateLogoutResponse).ok()).toBe(true)

        await page.locator("nav").getByText("Login", { exact: true }).click()
        await expect(page.getByRole("heading", { name: "Profiles" })).toBeVisible()
        const profileSettingsResponse = waitForSettingsResponse(page, profile.accessToken, "GET")
        await page.locator("main.window").getByRole("button", { name: profile.user.name, exact: true }).click()
        await expect(page.locator("nav").getByText(profile.user.name, { exact: true })).toBeVisible()
        const profileSettingsResult = await profileSettingsResponse
        expect(profileSettingsResult.ok()).toBe(true)
        expect((await profileSettingsResult.json() as UserSettings).privacy.profile).toBe(savedProfileSettings.privacy.profile)
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access)).toBe(profile.accessToken)
        await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("user") ?? "{}").id)).toBe(profile.user.id)
        await page.locator("nav").getByText(profile.user.name, { exact: true }).click()
        await expect(page).toHaveURL(/\/user\/[^/]+$/)
        await expect(page.getByRole("heading", { name: profile.user.name, exact: true })).toBeVisible()
        await page.getByRole("button", { name: /Profile/ }).click()
        await expect(page).toHaveURL(/\/profile\/account$/)
        await page.getByRole("link", { name: /Preferences/ }).click()
        await expect(page).toHaveURL(/\/profile\/preferences$/)
        await expectPreferenceView(page, savedProfileSettings)
    }
    catch (error) {
        testError = error
        hasTestError = true
    }
    finally {
        firstAdminGate.release()
        firstProfileGate.release()
        delayedProfileRefreshGate.release()
        delayedProfileSaveGate.release()
        delayedLogoutRefreshGate.release()
        try {
            await updateUserSettings(page, profile.accessToken, originalProfileSettings)
        }
        catch (cleanupError) {
            if (!hasTestError) throw cleanupError
            console.error("Failed to restore profile settings after the account-switch test failed.", cleanupError)
        }
    }
    if (hasTestError) throw testError
})

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

test("renders both inbox empty states", async ({ authenticatedPage: page }) => {
    await page.route(url => url.pathname === "/api/profile/notifications", async (route) => {
        const url = new URL(route.request().url())
        const requestedPageSize = Number(url.searchParams.get("pageSize") ?? 20)
        const pageSize = Math.min(50, Math.max(1, Math.trunc(requestedPageSize || 20)))
        const offset = Number(url.searchParams.get("offset")) || 0
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ total: 0, items: [], pageSize, offset, more: false }),
        })
    })
    await page.goto("/inbox")

    await expect(page.getByText("You have no unread notifications.", { exact: true })).toBeVisible()
    await page.locator("button.all").click()
    await expect(page.getByText("You don't have any notifications.", { exact: true })).toBeVisible()
})

test("loads additional notification pages without replacing existing items", async ({ authenticatedPage: page }) => {
    const suffix = Date.now()
    const notifications = Array.from({ length: 21 }, (_, index) => ({
        id: `notification:page${suffix}${index}`,
        recipient: "user:browser",
        context: `thread:page${suffix}${index}`,
        message: `Inbox page ${index + 1} ${suffix}`,
        time: new Date().toISOString(),
        viewed: false,
    }))

    await page.route(url => url.pathname === "/api/profile/notifications", async (route) => {
        const url = new URL(route.request().url())
        const requestedPageSize = Number(url.searchParams.get("pageSize") ?? 20)
        const pageSize = Math.min(50, Math.max(1, Math.trunc(requestedPageSize || 20)))
        const offset = Number(url.searchParams.get("offset")) || 0
        const items = notifications.slice(offset, offset + pageSize)
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                items,
                pageSize,
                offset,
                more: offset + pageSize < notifications.length,
                total: notifications.length,
            }),
        })
    })
    await page.goto("/inbox")

    const firstItem = page.getByText(`Inbox page 1 ${suffix}`, { exact: false })
    const lastItem = page.getByText(`Inbox page 21 ${suffix}`, { exact: false })
    await expect(firstItem).toBeVisible()
    await expect(lastItem).toBeHidden()
    await page.getByRole("button", { name: "Load More" }).click()
    await expect(firstItem).toBeVisible()
    await expect(lastItem).toBeVisible()
    await expect(page.getByRole("button", { name: "Load More" })).toBeHidden()
})

test("dismisses inbox notifications individually and in bulk", async ({ authenticatedPage: page }) => {
    const suffix = Date.now()
    const singleMarker = `Browser single dismiss ${suffix}`
    const bulkMarker = `Browser bulk dismiss ${suffix}`
    const notifications = [
        {
            id: `notification:browserSingle${suffix}`,
            recipient: "user:browser",
            context: "thread:browserSingle",
            message: singleMarker,
            time: new Date().toISOString(),
            viewed: false,
        },
        {
            id: `notification:browserBulk${suffix}`,
            recipient: "user:browser",
            context: "thread:browserBulk",
            message: bulkMarker,
            time: new Date().toISOString(),
            viewed: false,
        },
    ]

    await page.route(url => url.pathname.startsWith("/api/profile/notifications"), async (route) => {
        const url = new URL(route.request().url())
        if (url.pathname === "/api/profile/notifications") {
            const showDismissed = url.searchParams.get("dismissed") === "true"
            const visible = notifications.filter(notification => showDismissed || !notification.viewed)
            const requestedPageSize = Number(url.searchParams.get("pageSize") ?? 20)
            const pageSize = Math.min(50, Math.max(1, Math.trunc(requestedPageSize || 20)))
            const offset = Number(url.searchParams.get("offset")) || 0
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    total: visible.length,
                    items: visible.slice(offset, offset + pageSize),
                    pageSize,
                    offset,
                    more: visible.length > offset + pageSize,
                }),
            })
            return
        }

        if (url.pathname === "/api/profile/notifications/dismiss") {
            for (const notification of notifications) notification.viewed = true
        }
        else if (url.pathname.endsWith("/dismiss")) {
            const parts = url.pathname.split("/")
            const id = parts[4]
            const notification = notifications.find(item => extractId(item.id) === id)
            if (notification) notification.viewed = true
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(true),
        })
    })
    await page.goto("/inbox")

    const singleCard = page.locator("section article.box").filter({ hasText: singleMarker })
    await expect(singleCard).toBeVisible()
    await singleCard.getByText("Dismiss", { exact: true }).click()
    await expect(singleCard).toHaveCount(0)

    const showAllButton = page.locator("button.all")
    const showUnreadButton = page.locator("button.unread")

    await showAllButton.click()
    await expect(singleCard).toBeVisible()
    await expect(singleCard.getByText("Dismiss", { exact: true })).toHaveCount(0)
    await showUnreadButton.click()

    await expect(page.getByText(bulkMarker, { exact: false })).toBeVisible()
    await page.getByRole("button", { name: "Dismiss Unread" }).click()
    await expect(page.getByText(singleMarker, { exact: false })).toHaveCount(0)
    await expect(page.getByText(bulkMarker, { exact: false })).toHaveCount(0)
    await expect(page.getByText("You have no unread notifications.", { exact: true })).toBeVisible()

    await showAllButton.click()
    await expect(page.getByText(singleMarker, { exact: false })).toBeVisible()
    await expect(page.getByText(bulkMarker, { exact: false })).toBeVisible()
})

test("opens a comment notification at its discussion anchor", async ({ authenticatedPage: page, exampleServer }) => {
    const adminToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    const suffix = Date.now()
    const marker = `Browser comment notification ${suffix}`
    let postId: string | undefined
    let rootCommentId: string | undefined
    let replyId: string | undefined

    try {
        await page.goto("/feed/home")
        const postResponse = await page.request.post(apiUrl(page, "/api/post/add"), {
            headers: { Authorization: adminToken },
            data: {
                title: `Comment notification target ${suffix}`,
                content: "Comment notification browser test.",
                topics: [],
                images: [],
            },
        })
        expect(postResponse.ok()).toBe(true)
        const post = await postResponse.json() as { id: string }
        postId = extractId(post.id)

        const rootResponse = await page.request.post(apiUrl(page, "/api/comment/add"), {
            headers: { Authorization: adminToken },
            data: { context: post.id, replyTo: post.id, content: `Comment root ${suffix}` },
        })
        expect(rootResponse.ok()).toBe(true)
        const root = await rootResponse.json() as { id: string }
        rootCommentId = extractId(root.id)

        const replyResponse = await page.request.post(apiUrl(page, "/api/comment/add"), {
            headers: { Authorization: exampleServer.users.commentAuthor.accessToken },
            data: { context: post.id, replyTo: root.id, content: marker },
        })
        expect(replyResponse.ok()).toBe(true)
        const reply = await replyResponse.json() as { id: string }
        replyId = extractId(reply.id)

        await page.goto("/inbox")
        const notification = page.locator("section article.box").filter({ hasText: marker })
        await expect(notification).toBeVisible()
        await notification.getByText("Comment", { exact: true }).click()
        await expect(page).toHaveURL(new RegExp(`/post/${postId}#comment:${encodeURIComponent(replyId)}`))
        await expect(page.getByText(marker, { exact: true })).toBeVisible()
    }
    finally {
        const statements = [
            ...(replyId ? [`DELETE notification WHERE context = comment:${replyId};`, `DELETE comment:${replyId};`] : []),
            ...(rootCommentId ? [`DELETE notification WHERE context = comment:${rootCommentId};`, `DELETE comment:${rootCommentId};`] : []),
            ...(postId ? [`DELETE notification WHERE context = post:${postId};`, `DELETE post:${postId};`] : []),
        ]
        if (statements.length > 0) {
            const response = await page.request.post(apiUrl(page, "/api/developer/database/query"), {
                headers: { Authorization: adminToken },
                data: { query: statements.join("\n") },
            })
            expect(response.ok()).toBe(true)
        }
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