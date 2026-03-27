import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const user = await readBody<User>(event)

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            name = $name,
            link = $link,
            description = $description
        `)
        .addRecord("user", auth.id)
        .addParameter("name", user.name)
        .addParameter("link", user.link)
        .addParameter("description", user.description)
        .queryOne<User>()
})