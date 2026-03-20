import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE <record>$thread SET')
    sql.push('visits += 1')
    parameters['thread'] = `thread:${id}`
    return await queryOne<Thread>({ sql, parameters })
})