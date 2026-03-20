import type { AppSettings } from "~/types"

// INFO: these settings are public application configurations and are not sensitive.
// They are stored in the database for easy retrieval and management, and synchronized across all instances.
export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $settings
        `)
        .addRecord("settings", `appSettings:${id}`)
        .queryOne<AppSettings>()
})