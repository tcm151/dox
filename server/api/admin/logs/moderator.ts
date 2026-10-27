import type { ModeratorLog } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM moderatorLog
            ORDER BY time DESC
            LIMIT 100
            FETCH actor;
        `)
        .queryAll<ModeratorLog>()
})
