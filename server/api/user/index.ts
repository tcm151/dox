import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name, link, description, dateJoined, votes, followers, following, topics,
            roles, traits
            FROM user
            ORDER BY dateJoined DESC
        `)
        .queryAll<User>()
})