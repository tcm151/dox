import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { config } = await readBody<{ config: AppSettings }>(event)

    const { sql, parameters } = queryBuilder()
    sql.push('UPDATE $config.id CONTENT $config')
    parameters['user'] = auth
    parameters['config'] = config
    
    return await queryOne<AppSettings>({ sql, parameters })
})