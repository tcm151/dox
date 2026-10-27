import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import type { AppSettings } from "../../shared/types"
import { expectStatus, fetch, grabUser } from "../test-server"

const admin = await grabUser("admin")

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