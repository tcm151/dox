import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string, page: number, pageSize: number }>(event)
    
    const threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time,
            topics, replies, votes, score,
            edited, timeEdited, visits, images
            FROM thread
            WHERE replyTo = NONE
            ORDER BY time DESC
            FETCH user, replyTo, images
        `)
        .queryAll<Thread>()

    return sortList(threads, query.sortBy)
})