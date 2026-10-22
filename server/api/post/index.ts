import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string, page: number, pageSize: number }>(event)
    
    const posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
            replyTo.id, replyTo.title, topics, comments, votes, score,
            archived, images.{id, url} AS images, visits
            FROM post
            WHERE archived != true
            ORDER BY time DESC
            FETCH user, replyTo
        `)
        .queryAll<Post>()
    
    return sortList(posts, query.sortBy)
})