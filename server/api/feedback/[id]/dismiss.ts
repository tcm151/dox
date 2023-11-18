import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    let { sql, parameters } = queryBuilder()
    sql.push('UPDATE $feedback SET')
    sql.push('active = false')
    parameters['feedback'] = `feedback:${id}`
    return await queryOne<Feedback>({ sql, parameters })
})