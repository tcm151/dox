import type { Post, Image, Thread } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string, page: number, pageSize: number }>(event)
    
    let posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
                replyTo.id, replyTo.title, topics, comments, votes, score,
                archived, images, visits
            FROM post
            WHERE archived != true
            ORDER BY time DESC
            FETCH user, replyTo, images
        `)
        .queryAll<Post>()

    let threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time,
                topics, quote, replies, votes, score,
                edited, timeEdited, visits, images
            FROM thread
            WHERE replyTo = NONE
            ORDER BY time DESC
            FETCH user, quote, quote.user, images
        `)
        .queryAll<Thread>()

    let images = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, votes, type, tokens, time, url
            FROM image
            WHERE public = true
            ORDER BY time DESC
            FETCH user
        `)
        .queryAll<Image>()

    return sortList([...posts, ...images, ...threads], query.sortBy)
})