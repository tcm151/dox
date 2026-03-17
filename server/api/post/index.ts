import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{
        sortBy: string,
        page: number,
        pageSize: number
    }>(event)
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, title, time, edited, timeEdited,')
    sql.push('replyTo.id, replyTo.title, topics, comments, votes,')
    sql.push('archived, images, visits')
    sql.push('FROM post')
    sql.push('WHERE archived != true')
    sql.push('ORDER BY time DESC')
    if (query.page && query.pageSize) {
        sql.push('LIMIT $pageSize')
        sql.push('START $pageStart')
        parameters['pageSize'] = Number(query.pageSize ?? 100)
        parameters['pageStart'] = (Number(query.page) - 1) * Number(query.pageSize ?? 5)
    }
    sql.push('FETCH user, replyTo, images')
    
    let posts = await queryAll<Post>({ sql, parameters })
    return sortList(posts, query.sortBy)
})