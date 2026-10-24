import type { Gallery, Post, Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    let query = getQuery<{ sortBy: string }>(event)

    let posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
                replyTo.id, replyTo.title, topics, comments, votes, score,
                archived, images.{id, url} AS images, visits
            FROM post
            WHERE topics CONTAINS $topic
            AND archived != true
            ORDER BY time DESC
            FETCH user, replyTo
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Post>()

    let threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time,
                topics, quote, replies, votes, score,
                edited, timeEdited, visits, images.{id, url} AS images
            FROM thread
            WHERE topics CONTAINS $topic
            AND replyTo = NONE
            ORDER BY time DESC
            FETCH user, quote, quote.user
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Thread>()

    let galleries = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, description, time,
                topics, images.{id, url} AS images, votes, score, visits, archived
            FROM gallery
            WHERE topics CONTAINS $topic
            AND archived != true
            ORDER BY time DESC
            FETCH user
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Gallery>()

    return sortList([...posts, ...threads, ...galleries], query.sortBy)
})