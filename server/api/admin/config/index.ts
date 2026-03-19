import type { AppSettings } from "~/types"

// INFO: these are publicly accessible, so no authentication is required.
// Only displays the configuration options that are needed on the client.
export default defineEventHandler(async (event) => {
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM appSettings')
    return await queryAll<AppSettings>({ sql, parameters })
})