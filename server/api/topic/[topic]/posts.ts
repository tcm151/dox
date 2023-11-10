import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, time,')
    sql.push('replyTo.id, replyTo.title, topics, comments, votes,')
    sql.push('images')
    sql.push('FROM post')
    sql.push('WHERE topics CONTAINS $topic')
    sql.push('FETCH user, replyTo, images')
    parameters['topic'] = `topic:${topic}`
    return await queryAll<Post>({ sql, parameters })
})