import type { Error } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "developer")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, status, description, time, stack, data,
                user.id, user.name
            FROM error
            ORDER BY time DESC
        `)
        .queryAll<Error>()
})