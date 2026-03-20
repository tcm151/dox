import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    let { user, role } = await readBody<{ user: string, role: string }>(event)

    const { sql, parameters } = queryBuilder()
    sql.push('UPDATE <record>$user SET')
    sql.push('roles = array::difference(roles, [$role]);')
    parameters['user'] = user
    parameters['role'] = role

    return await queryOne<User>({ sql, parameters })
})