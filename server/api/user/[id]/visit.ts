import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const user = await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            visits += 1    
        `)
        .addRecord("user", `user:${id}`)
        .queryOne<User>()

    return user.visits
})