import type { Post } from "~/types"

// REFACTOR to new query standards
export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, time, replyTo.id, replyTo.title,')
    sql.push('topics, comments, votes, archived, images, visits')
    sql.push('FROM post')
    sql.push('WHERE user = $user')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user, images')
    parameters['user'] = `user:${id}`
    return await queryAll<Post>({ sql, parameters })
})