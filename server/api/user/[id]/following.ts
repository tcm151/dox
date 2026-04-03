import type { User } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name, roles, traits, dateJoined, votes, score
            FROM user
            WHERE $user.following CONTAINS id
            ORDER BY score DESC
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<User>()
})