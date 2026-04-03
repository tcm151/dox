import type { User, Topic } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM moderationRequest
            FETCH topic, user
        `)
        .addRecord("user", auth.id)
        .queryAll<{ id: string, topic: Topic, user: User }[]>()
})