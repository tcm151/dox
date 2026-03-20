import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string, page: number, pageSize: number }>(event)
    
    const posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
            replyTo.id, replyTo.title, topics, comments, votes,
            archived, images, visits
            FROM post
            WHERE archived != true
            ORDER BY time DESC
            FETCH user, replyTo, images
        `)
        .queryAll<Post>()
    
    return sortList(posts, query.sortBy)
})