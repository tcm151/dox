import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM <record>$settings
        `)
        .addParameter("settings", `appSettings:${id}`)
        .queryOne<AppSettings>()
})