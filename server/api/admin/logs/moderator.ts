import type { ModeratorLog } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, actor.{id, name, roles}, action, target, details, time
            FROM moderatorLog
            ORDER BY time DESC
            LIMIT 100
            ;
        `)
        .queryAll<ModeratorLog>()
})
