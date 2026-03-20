import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { id } = event.context.params!
    
    let { sql, parameters } = queryBuilder()
    sql.push('UPDATE feedback SET')
    sql.push('dismissed = true')
    sql.push('WHERE id = <record>$feedback')
    parameters['feedback'] = `feedback:${id}`
    return await queryOne<Feedback>({ sql, parameters })
})