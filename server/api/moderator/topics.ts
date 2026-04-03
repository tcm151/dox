import type { User } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM topic
            WHERE moderators CONTAINS $user
            ORDER BY score DESC
        `)
        .addRecord("user", auth.id)
        .queryAll<User>()
})