import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string, page: number, pageSize: number }>(event)
    
    const posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, title, string::slice(content, 0, 512) AS content, tags, time, edited, timeEdited,
            replyTo.{id, title, tags}, topics, comments, votes, score,
            status, images.{id, url}, visits, moderation
            FROM post
            WHERE status = "active"
            ORDER BY time DESC
        `)
        .queryAll<Post>()
    
    return sortList(posts, query.sortBy)
})