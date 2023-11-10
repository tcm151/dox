import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    let { page, pageSize } = getQuery(event)
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, time,')
    sql.push('replyTo.id, replyTo.title, topics, comments, votes,')
    sql.push('images')
    sql.push('FROM post')
    sql.push('ORDER BY time DESC')
    if (page && pageSize) {
        sql.push('LIMIT $pageSize')
        sql.push('START $pageStart')
        parameters['pageSize'] = Number(pageSize ?? 100)
        parameters['pageStart'] = (Number(page) - 1) * Number(pageSize ?? 5)
    }
    sql.push('FETCH user, replyTo, images')
    
    return await queryAll<Post>({ sql, parameters })
})