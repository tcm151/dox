import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    const { config: settings } = await readBody<{ config: any }>(event)
    delete settings.id

    return await new DatabaseQuery()
        .addSql(`
            UPDATE appSettings
            CONTENT $settings
            WHERE id = $id
        `)
        .addRecord('id', id)
        .addParameter('settings', settings)
        .queryOne<AppSettings>()
})