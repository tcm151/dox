import type { Image } from "~/types";

export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM image')
    sql.push('ORDER BY time DESC')
    return await queryAll<Image>({ sql })
})