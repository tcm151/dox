import type { Comment } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { content } = await readBody<{ content: string }>(event)
    const { commentId } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $comment')
    parameters['comment'] = `comment:${commentId}`
    const comment = await queryOne<Comment>({ sql, parameters })

    if (comment.user === auth.id) {
        const { sql, parameters } = queryBuilder()
        sql.push('UPDATE $comment SET')
        sql.push('content = $content,')
        sql.push('edited = true,')
        sql.push('timeEdited = time::now()')
        parameters['comment'] = `comment:${commentId}`
        parameters['content'] = content
        return await queryOne<Comment>({ sql, parameters })
    }

    return false
})