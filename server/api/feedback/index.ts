import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT id, content, time, user.id, user.name, active')
    sql.push('FROM feedback')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user')
    return await queryAll<Feedback>({ sql })
})