import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    let { page, pageSize } = getQuery(event)
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, time, replyTo.id, replyTo.title, topics, comments, votes')
    sql.push('FROM post')
    sql.push('ORDER BY time DESC')
    sql.push('LIMIT $pageSize')
    sql.push('START $pageStart')
    sql.push('FETCH user, replyTo')
    parameters['pageSize'] = Number(pageSize ?? 100)
    parameters['pageStart'] = (Number(page) - 1) * Number(pageSize ?? 5)
    return await queryAll<Post>({ sql, parameters })
})