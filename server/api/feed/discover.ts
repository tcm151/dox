import type { Post, Image, Thread } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{
        sortBy: string,
        page: number,
        pageSize: number
    }>(event)
    
    var { sql, parameters } = queryBuilder()
    sql.push(`
        SELECT id, user.id, user.name, title, time, edited, timeEdited,
        replyTo.id, replyTo.title, topics, comments, votes,
        archived, images, visits
        FROM post
        WHERE archived != true
        ORDER BY time DESC
    `)
    sql.push('FETCH user, replyTo, images')
    let posts = await queryAll<Post>({ sql, parameters })

    var { sql } = queryBuilder()
    sql.push(`
        SELECT id, user.id, user.name, votes, type, tokens, time, url
        FROM image
        WHERE public = true
        ORDER BY time DESC
        FETCH user
    `)
    let images = await queryAll<Image>({ sql })
    
    var { sql, parameters } = queryBuilder()
    sql.push(`
        SELECT id, user.id, user.name, content, time,
        replyTo.id, replyTo.title, topics, replies, votes, edited, timeEdited, visits,
        images
        FROM thread
        // WHERE replyTo = NONE
        ORDER BY time DESC
        FETCH user, replyTo, images
    `)
    let threads = await queryAll<Thread>({ sql, parameters })

    return sortList([...posts, ...images, ...threads], query.sortBy)
})