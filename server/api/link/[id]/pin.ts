import type { Pin } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    return await new DatabaseQuery()
        .addSql(`
            CREATE pin SET
                item = $link,
                scope = "app",
                user = $user;
        `)
        .addRecord("link", `link:${id}`)
        .addRecord("user", auth.id)
        .queryOne<Pin>()
})