import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { config: settings } = await readBody<{ config: any }>(event)
    const id = settings.id
    delete settings.id

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $id
            CONTENT $settings
        `)
        .addRecord('id', id)
        .addParameter('settings', settings)
        .queryOne<AppSettings>()
})