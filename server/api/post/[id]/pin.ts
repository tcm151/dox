import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])    
    
    const { id } = event.context.params!

        return await new DatabaseQuery()
            .addSql(`
                CREATE pin SET
                post = $post,
                user = $user;
            `)
            .addRecordId("post", `post:${id}`)
            .addRecordId("user", auth.id)
            .queryOne<Pin>()
})