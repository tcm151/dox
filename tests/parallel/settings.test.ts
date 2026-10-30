import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import type { AppSettings, UserSettings } from "../../shared/types"
import { expectStatus, fetch, grabExampleServer, grabUser } from "../test-server"

const admin = await grabUser("admin")
const otherUser = (await grabExampleServer("default")).users.commentAuthor

it("persists and restores the About summary setting", async () => {
    const settingsResponse = await fetch("/api/settings/default")
    expectStatus(settingsResponse, 200)
    const originalSettings = await settingsResponse.json() as AppSettings
    expect(originalSettings.about.summary).toBe("")
    const updatedSettings: AppSettings = {
        ...originalSettings,
        about: { summary: "## About summary test\n\nThis content was saved by the integration test." },
    }
    const updateSettings = (settings: AppSettings) => admin.fetchRaw(
        `/api/admin/settings/${extractId(settings.id)}/update`,
        {
            method: "POST",
            body: settings,
        },
    )

    try {
        expectStatus((await updateSettings(updatedSettings)), 200)

        const updatedResponse = await fetch("/api/settings/default")
        expectStatus(updatedResponse, 200)
        const savedSettings = await updatedResponse.json() as AppSettings
        expect(savedSettings.about.summary).toBe(updatedSettings.about.summary)
    }
    finally {
        expectStatus((await updateSettings(originalSettings)), 200)
    }
})

it("rejects malformed notification preferences without changing saved settings", async () => {
    const originalSettings = await admin.fetch<UserSettings>("/api/profile/settings")
    const invalidSettings: UserSettings = {
        ...originalSettings,
        notifications: {
            ...originalSettings.notifications,
            inApp: "false" as unknown as boolean,
        },
    }

    const response = await admin.fetchRaw("/api/profile/settings/update", {
        method: "PUT",
        body: invalidSettings,
    })
    expectStatus(response, 400)

    const savedSettings = await admin.fetch<UserSettings>("/api/profile/settings")
    expect(savedSettings.notifications).toEqual(originalSettings.notifications)
    expect(savedSettings.ui).toEqual(originalSettings.ui)
})

it("persists UI preferences only for the authenticated user", async () => {
    const originalAdminSettings = await admin.fetch<UserSettings>("/api/profile/settings")
    const originalOtherSettings = await otherUser.fetch<UserSettings>("/api/profile/settings")
    const updatedSettings: UserSettings = {
        ...originalAdminSettings,
        ui: {
            hoverAnimations: !originalAdminSettings.ui.hoverAnimations,
            hintDuration: originalAdminSettings.ui.hintDuration + 500,
        },
    }

    try {
        const updateResponse = await admin.fetchRaw("/api/profile/settings/update", {
            method: "PUT",
            body: updatedSettings,
        })
        expectStatus(updateResponse, 200)

        const savedAdminSettings = await admin.fetch<UserSettings>("/api/profile/settings")
        expect(savedAdminSettings.ui).toEqual(updatedSettings.ui)
        expect(savedAdminSettings.notifications).toEqual(originalAdminSettings.notifications)

        const savedOtherSettings = await otherUser.fetch<UserSettings>("/api/profile/settings")
        expect(savedOtherSettings).toEqual(originalOtherSettings)
    }
    finally {
        const restoreResponse = await admin.fetchRaw("/api/profile/settings/update", {
            method: "PUT",
            body: originalAdminSettings,
        })
        expectStatus(restoreResponse, 200, "restore admin preferences")
    }
})