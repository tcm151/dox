import type { Pin } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { active } = await readBody<{ active: boolean }>(event)
    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    
    sql.push('IF $user.admin {')
    sql.push('RETURN UPDATE $pin SET')
    sql.push('active = $active')
    sql.push('}')
    
    parameters['pin'] = `pin:${id}`
    parameters['user'] = auth.id
    parameters['active'] = active
    
    return await queryOne<Pin>({ sql, parameters })

})