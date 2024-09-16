import type { Audio } from "~/types"

export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, votes, type, tokens, time, url')
    sql.push('FROM audio')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user')
    return await queryAll<Audio>({ sql })
})