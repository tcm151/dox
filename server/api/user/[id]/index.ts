import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, name, link, description, dateJoined, votes, followers, following, topics
            FROM $user
        `)
        .addRecord("user", `user:${id}`)
        .queryOne<User>()
})