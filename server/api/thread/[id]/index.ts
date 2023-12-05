import type { Thread } from "~/types";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, content, time,')
    sql.push('replyTo.id, replyTo.content, topics, votes, edited, timeEdited, visits,')
    sql.push('images')
    // sql.push('(')
    // sql.push('SELECT id, time, user.id, user.name, post.id,')
    // sql.push('replyTo, content, votes, edited, timeEdited')
    // sql.push('FROM $post.comments')
    // sql.push('ORDER BY time DESC')
    // sql.push('FETCH user, post')
    // sql.push(') AS comments')
    sql.push('FROM $thread')
    sql.push('FETCH user, replyTo, images')
    parameters['thread'] = `thread:${id}`
    
    return await queryOne<Thread>({ sql, parameters })
})