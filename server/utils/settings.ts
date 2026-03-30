import type { AppSettings } from "@@/shared/types"

class SettingsManager {
    async getById(id: string = "default") {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM $settings
            `)
            .addRecord("settings", `appSettings:${id}`)
            .queryOne<AppSettings>()
    }
}

export const settingsManager = new SettingsManager()