import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    let body = await readBody<{ user: string, role: string }>(event)

    const user = await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            roles = array::difference(roles, [$role]);
        `)
        .addRecordId('user', body.user)
        .addParameter('role', body.role)
        .queryOne<User>()

    return user.roles
})