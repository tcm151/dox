import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, content, time, edited, timeEdited,')
    sql.push('replyTo.id, replyTo.content, topics, votes,  visits,')
    sql.push('images,')
    sql.push('(')
    sql.push('SELECT id, user.id, user.name, content, time, edited, timeEdited,')
    sql.push('replyTo.id, replyTo.content, topics, replies, votes,  visits,')
    sql.push('images')
    sql.push('FROM (<record>$thread).replies')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user, thread')
    sql.push(') AS replies')
    sql.push('FROM <record>$thread')
    sql.push('FETCH user, replyTo, images')
    parameters['thread'] = `thread:${id}`
    
    return await queryOne<Thread>({ sql, parameters })
})