import { randomUUID } from "node:crypto"
import type { User, UserSettings } from "../../shared/types"
import { extractId } from "../../shared/utils/records"
import { expect, test } from "../utils/browser-fixtures"

test("hides profile details and feed information for a restricted viewer", async ({ authenticatedPage: page, request }) => {
    const suffix = `${Date.now()}${randomUUID().slice(0, 6)}`
    const name = `Privacy${suffix}`
    const password = "ProfilePrivacyTest-password"
    const uuid = randomUUID().replaceAll("-", "")
    const ip = `2001:db8:${uuid.slice(0, 4)}:${uuid.slice(4, 8)}:${uuid.slice(8, 12)}:${uuid.slice(12, 16)}:${uuid.slice(16, 20)}:${uuid.slice(20, 24)}`
    const adminToken = await page.evaluate(() => JSON.parse(localStorage.getItem("tokens") ?? "{}").access as string)
    let accessToken: string | undefined
    let userId: string | undefined

    try {
        const registration = await request.post("/api/user/register", {
            headers: { "X-Forwarded-For": ip },
            data: { username: name, email: `${name.toLowerCase()}@example.invalid`, password },
        })
        if (!registration.ok()) throw new Error(await registration.text())
        accessToken = await registration.text()

        const userResponse = await request.get("/api/profile/authenticate", {
            headers: { Authorization: accessToken },
        })
        if (!userResponse.ok()) throw new Error(await userResponse.text())
        const user = await userResponse.json() as User
        userId = user.id

        const profileUpdate = await request.post("/api/profile/update", {
            headers: { Authorization: accessToken },
            data: {
                name,
                link: "https://profile-privacy.invalid",
                description: "Private profile description",
            },
        })
        if (!profileUpdate.ok()) throw new Error(await profileUpdate.text())

        const settingsResponse = await request.get("/api/profile/settings", {
            headers: { Authorization: accessToken },
        })
        if (!settingsResponse.ok()) throw new Error(await settingsResponse.text())
        const settings = await settingsResponse.json() as UserSettings
        const settingsUpdate = await request.put("/api/profile/settings/update", {
            headers: { Authorization: accessToken },
            data: { ...settings, privacy: { profile: "private" } },
        })
        if (!settingsUpdate.ok()) throw new Error(await settingsUpdate.text())

        await page.goto(`/user/${extractId(user.id)}`)

        const profile = page.locator("main.box")
        await expect(profile.getByRole("heading", { name, exact: true })).toBeVisible()
        await expect(profile.getByText("This profile's details, social information, and profile feed are restricted by the user's audience setting.")).toBeVisible()
        await expect(profile.getByText(/visits/)).toBeVisible()
        await expect(profile.getByRole("link", { name: "https://profile-privacy.invalid" })).toHaveCount(0)
        await expect(profile.getByText("Private profile description", { exact: true })).toHaveCount(0)
        await expect(profile.getByText(/topics/)).toHaveCount(0)
        await expect(profile.getByText(/followers/)).toHaveCount(0)
        await expect(profile.getByText(/following/)).toHaveCount(0)
    }
    finally {
        if (accessToken) {
            const statements = [`DELETE session WHERE id = ${accessToken};`]
            if (userId) {
                statements.push(
                    `DELETE userSettings WHERE user = ${userId};`,
                    `DELETE account WHERE user = ${userId};`,
                    `DELETE ${userId};`,
                )
            }
            const cleanup = await request.post("/api/developer/database/query", {
                headers: { Authorization: adminToken },
                data: { query: statements.join("\n") },
            })
            if (!cleanup.ok()) throw new Error(await cleanup.text())
        }
    }
})
