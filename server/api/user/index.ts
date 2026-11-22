import type { User } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"

export default defineEventHandler(async (event) => {
    const viewer = await authenticateOptionalRequest(event)

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name, link, description, dateJoined, votes, score,
                followers, following, topics, roles, traits
            FROM user
            WHERE id != user:deleted
            AND fn::can_view_profile(id, $viewer)
            ORDER BY dateJoined DESC
        `)
        .addRecord("viewer", viewer?.id)
        .addParameter("authenticated", viewer !== undefined)
        .queryAll<User>()
})