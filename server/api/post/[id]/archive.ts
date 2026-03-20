import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $post SET
            archived = !archived
        `)
        .addRecordId("post", `post:${id}`)
        .queryOne<Post>()
})