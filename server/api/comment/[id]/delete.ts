import type { Comment } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!

    const comment = await new DatabaseQuery()
        .addSql(`
            IF $comment.user = $user {
                RETURN UPDATE $comment SET
                content = $content,
                deleted = true
            }
        `)
        .addRecordId("comment", `comment:${id}`)
        .addParameter("content", "[deleted]")
        .addRecordId("user", auth.id)
        .queryOne<Comment>()

    return comment.deleted
})