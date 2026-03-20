import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const user = await readBody<User>(event)

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            link = $link,
            description = $description
        `)
        .addRecordId("user", auth.id)
        .addParameter("link", user.link)
        .addParameter("description", user.description)
        .queryOne<User>()
})