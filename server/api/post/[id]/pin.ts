import type { Pin } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])    
    
    const { id } = event.context.params!

        return await new DatabaseQuery()
            .addSql(`
                CREATE pin SET
                    item = $post,
                    user = $user;
            `)
            .addRecord("post", `post:${id}`)
            .addRecord("user", auth.id)
            .queryOne<Pin>()
})