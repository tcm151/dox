import type { User } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    const viewer = await authenticateOptionalRequest(event)
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name,
                IF $visible THEN link ELSE NONE END AS link,
                IF $visible THEN description ELSE NONE END AS description,
                dateJoined,
                IF $visible THEN topics ELSE [] END AS topics,
                IF $visible THEN followers ELSE [] END AS followers,
                IF $visible THEN following ELSE [] END AS following,
                visits, votes, score,
                $visible AS visible
            FROM $user
        `)
        .addRecord("user", `user:${id}`)
        .addParameter("visible", await UserSettingsManager.canViewProfile(`user:${id}`, viewer))
        .queryOne<User>()
})