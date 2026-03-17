import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { id } = event.context.params!
    const { active } = await readBody<{ active: boolean }>(event)
    
    const { sql, parameters } = queryBuilder()
    sql.push('UPDATE $pin SET')
    sql.push('active = $active')
    parameters['pin'] = `pin:${id}`
    parameters['user'] = auth.id
    parameters['active'] = active
    return await queryOne<Pin>({ sql, parameters })
})