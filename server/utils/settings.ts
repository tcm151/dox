import type { AppSettings } from "@@/shared/types"

class SettingsManager {
    async get(id: string = "default") {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM $settings
            `)
            .addRecord("settings", `appSettings:${id}`)
            .queryOne<AppSettings>()
    }
    async update(id: string, settings: AppSettings) {
        return await new DatabaseQuery()
            .addSql(`
                UPDATE appSettings
                CONTENT $settings
                WHERE id = $id
            `)
            .addRecord('id', id)
            .addParameter('settings', settings)
            .queryOne<AppSettings>()
    }
}

export const settingsManager = new SettingsManager()