import type { User } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    const viewer = await authenticateOptionalRequest(event)
    if (!await UserSettingsManager.canViewProfile(`user:${id}`, viewer)) return []

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name, roles, traits, dateJoined, votes, score
            FROM user
            WHERE $user.followers CONTAINS id
            ORDER BY score DESC
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<User>()
})