import type { Draft } from "@@/shared/types"

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