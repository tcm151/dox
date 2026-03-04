import type { Image } from "~/types"

export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, votes, type, tokens, time, url')
    sql.push('FROM image')
    sql.push('WHERE public = true')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user')
    return await queryAll<Image>({ sql })
})