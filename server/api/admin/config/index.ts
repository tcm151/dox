import type { AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM appSettings')
    return await queryAll<AppSettings>({ sql, parameters })
})