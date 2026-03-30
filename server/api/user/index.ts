import type { User } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name, link, description, dateJoined, votes, score,
                followers, following, topics, roles, traits
            FROM user
            ORDER BY dateJoined DESC
        `)
        .queryAll<User>()
})