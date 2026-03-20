import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { config } = await readBody<{ config: AppSettings }>(event)

    const { sql, parameters } = queryBuilder()
    sql.push('UPDATE <record>$configId')
    sql.push('CONTENT $config')
    parameters['user'] = auth
    parameters['configId'] = config.id
    parameters['config'] = config
    
    return await queryOne<AppSettings>({ sql, parameters })
})