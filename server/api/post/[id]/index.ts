import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, content, time,')
    sql.push('replyTo.id, replyTo.title, topics, votes, edited, timeEdited, visits,')
    sql.push('images')
    sql.push('FROM $post')
    sql.push('FETCH user, replyTo, images')
    parameters['post'] = `post:${id}`
    
    return await queryOne<Post>({ sql, parameters })
})