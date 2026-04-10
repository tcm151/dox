import type { Post, Image, Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let query = getQuery<{ sortBy: string }>(event)
    
    let posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
                replyTo.id, replyTo.title, topics, comments, votes, score,
                archived, images, visits
            FROM post
            WHERE archived != true
            AND (topics CONTAINSANY $user.topics OR $user.following CONTAINS user.id)
            ORDER BY time DESC
            FETCH user, replyTo, images
        `)
        .addRecord("user", auth.id)
        .queryAll<Post>()

    let threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time,
                topics, quote, replies, votes, score,
                edited, timeEdited, visits, images
            FROM thread
            WHERE replyTo = NONE
            AND (topics CONTAINSANY $user.topics OR $user.following CONTAINS user.id)
            ORDER BY time DESC
            FETCH user, quote, quote.user, images
        `)
        .addRecord("user", auth.id)
        .queryAll<Thread>()

    // let images = await new DatabaseQuery()
    //     .addSql(`
    //         SELECT id, user.id, user.name, votes, type, tokens, time, url, score, visits
    //         FROM image
    //         WHERE public = true
    //         ORDER BY time DESC
    //         FETCH user
    //     `)
    //     .addRecord("user", auth.id)
    //     .queryAll<Image>()

    return sortList([...posts, ...threads], query.sortBy)
})