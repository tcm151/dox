import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { config: settings } = await readBody<{ config: AppSettings }>(event)

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $settings
            CONTENT $content
        `)
        .addRecordId('settings', settings.id)
        .addParameter('conteent', settings)
        .queryOne<AppSettings>()
})