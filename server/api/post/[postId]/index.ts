import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, content, time, replyTo.id, replyTo.title, topics, votes, edited, timeEdited, visits')
    sql.push('FROM $post')
    sql.push('FETCH user, replyTo')
    parameters['post'] = `post:${postId}`
    
    return await queryOne<Post>({ sql, parameters })
})