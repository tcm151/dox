import type { Pin } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    
    sql.push('IF $user.admin {')
    sql.push('RETURN DELETE $pin;')
    sql.push('}')
    parameters['user'] = auth
    parameters['pin'] = `pin:${id}`

    return await queryOne<Pin>({ sql, parameters })

})