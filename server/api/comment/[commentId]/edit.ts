import { Comment } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { commentId } = event.context.params!
    let comment = await queryOne<Comment>([`
        SELECT *
        FROM comment:${commentId}
    `])
    
    if (comment.user === auth.id) {
        const content = await readBody(event)
        return await queryOne<Comment>([`
            UPDATE comment:${commentId} SET
            content = "${content}",
            edited = true,
            timeEdited = time::now()
        `])
    }
})