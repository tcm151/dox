import type { Draft } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM draft
            WHERE user = $user
            ORDER BY time DESC
        `)
        .addRecord('user', auth.id)
        .queryAll<Draft>()
})