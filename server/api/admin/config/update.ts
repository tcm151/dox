import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { config } = await readBody<{ config: AppSettings }>(event)

    const { sql, parameters } = queryBuilder()
    sql.push('IF $user.roles CONTAINS "admin" {')
    sql.push('RETURN UPDATE $config.id CONTENT $config')
    sql.push('}')
    
    parameters['user'] = auth
    parameters['config'] = config
    
    return await queryOne<AppSettings>({ sql, parameters })
})