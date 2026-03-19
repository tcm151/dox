import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, navbar.*, feed.*, voting.*')
    sql.push('FROM $settings')
    parameters["settings"] = `appSettings:${id}`
    return await queryOne<AppSettings>({ sql, parameters })
})