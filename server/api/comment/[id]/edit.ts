import type { Comment } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const body = await readBody<{ content: string }>(event)
    const { id } = event.context.params!

    const comment = await new DatabaseQuery()
        .addSql(`
            IF $comment.user = $user {
                RETURN UPDATE $comment SET
                content = $content,
                edited = true,
                timeEdited = time::now()
            }
        `)
        .addRecord("comment", `comment:${id}`)
        .addRecord("user", auth.id)
        .addParameter("content", body.content)
        .queryOne<Pick<Comment, "timeEdited">>()

    return comment.timeEdited
})