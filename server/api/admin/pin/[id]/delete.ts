import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    sql.push('DELETE <record>$pin')
    parameters['pin'] = `pin:${id}`
    return await queryOne<Pin>({ sql, parameters })
})