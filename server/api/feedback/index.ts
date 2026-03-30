import type { Feedback } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, content, time, user.id, user.name, dismissed
            FROM feedback
            ORDER BY time DESC
            FETCH user
        `)
        .queryAll<Feedback>()
})