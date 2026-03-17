import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{
        sortBy: string,
        page: number,
        pageSize: number
    }>(event)
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, user.id, user.name, content, time,')
    sql.push('replyTo.id, replyTo.title, topics, replies, votes, edited, timeEdited, visits,')
    sql.push('images')
    sql.push('FROM thread')
    // sql.push('WHERE replyTo = NONE')
    sql.push('ORDER BY time DESC')
    if (query.page && query.pageSize) {
        sql.push('LIMIT $pageSize')
        sql.push('START $pageStart')
        parameters['pageSize'] = Number(query.pageSize ?? 100)
        parameters['pageStart'] = (Number(query.page) - 1) * Number(query.pageSize ?? 5)
    }
    sql.push('FETCH user, replyTo, images')
    let threads =  await queryAll<Thread>({ sql, parameters })

    return sortList(threads, query.sortBy)
})