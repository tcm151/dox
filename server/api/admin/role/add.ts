import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!hasRole(auth, ["admin", "developer"])) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }
    
    let { user, role } = await readBody<{ user: string, role: string }>(event)

    const { sql, parameters } = queryBuilder()
    sql.push('UPDATE $user SET')
    sql.push('roles = array::union(roles, [$role]);')
    parameters['user'] = user
    parameters['role'] = role

    return await queryOne<User>({ sql, parameters })
})