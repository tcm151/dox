import type { Gallery, Post, Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    let query = getQuery<{ sortBy: string }>(event)

    let posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
                replyTo.id, replyTo.title, topics, comments, votes, score,
                archived, images.{id, url} AS images, visits
            FROM post
            WHERE user = $user
            AND archived != true
            ORDER BY time DESC
            FETCH user, replyTo
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Post>()

    let threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time,
                topics, quote, replies, votes, score,
                edited, timeEdited, visits, images.{id, url} AS images
            FROM thread
            WHERE user = $user
            AND replyTo = NONE
            ORDER BY time DESC
            FETCH user, quote, quote.user
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Thread>()

    let galleries = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, description, time,
                topics, images.{id, url} AS images, votes, score, visits, archived
            FROM gallery
            WHERE user = $user
            AND archived != true
            ORDER BY time DESC
            FETCH user
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Gallery>()

    return sortList([...posts, ...threads, ...galleries], query.sortBy)
})