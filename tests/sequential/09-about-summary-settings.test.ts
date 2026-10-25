import { expect, it } from "vitest"
import { extractId } from "../../shared/utils/records"
import type { AppSettings } from "../../shared/types"
import { fetch, grabUser } from "../test-server"

const admin = await grabUser("admin")

it("saves and reads back the About summary setting", async () => {
    const settingsResponse = await fetch("/api/settings/default")
    expect(settingsResponse.status).toBe(200)
    const originalSettings = await settingsResponse.json() as AppSettings
    expect(originalSettings.about.summary).toBe("")
    const updatedSettings: AppSettings = {
        ...originalSettings,
        about: { summary: "## About summary test\n\nThis content was saved by the integration test." },
    }
    const updateSettings = (settings: AppSettings) => fetch(
        `/api/admin/settings/${extractId(settings.id)}/update`,
        {
            method: "POST",
            headers: {
                Authorization: admin.accessToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(settings),
        },
    )

    try {
        expect((await updateSettings(updatedSettings)).status).toBe(200)

        const updatedResponse = await fetch("/api/settings/default")
        expect(updatedResponse.status).toBe(200)
        const savedSettings = await updatedResponse.json() as AppSettings
        expect(savedSettings.about.summary).toBe(updatedSettings.about.summary)
    }
    finally {
        expect((await updateSettings(originalSettings)).status).toBe(200)
    }
})