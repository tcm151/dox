import type { User } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, firstUsed, votes, score
            FROM topic
            WHERE $user.topics CONTAINS id
            ORDER BY score DESC
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<User>()
})