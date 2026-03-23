import { AppSettings } from "~/types"

export async function useSettings(id: string = "default") {
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $settings
        `)
        .addRecord("settings", `appSettings:${id}`)
        .queryOne<AppSettings>()
}