import type { Comment } from "~/types";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, time, user.id, user.name, post.id,')
    sql.push('replyTo, content, votes, edited, timeEdited')
    sql.push('FROM comment')
    sql.push('WHERE post.id = $post')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user, post')
    parameters['post'] = `post:${id}`
    
    return await queryAll<Comment>({ sql, parameters })
})