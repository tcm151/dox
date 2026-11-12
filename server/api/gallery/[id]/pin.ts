import type { Pin } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    return await new DatabaseQuery()
        .addSql(`
            CREATE pin SET
                item = $gallery,
                scope = "app",
                user = $user;
        `)
        .addRecord("gallery", `gallery:${id}`)
        .addRecord("user", auth.id)
        .queryOne<Pin>()
})