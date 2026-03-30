import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    let query = getQuery<{ sortBy: string }>(event)

    let posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, edited, timeEdited,
                replyTo.id, replyTo.title, topics, comments, votes, score,
                archived, images, visits
            FROM post
            WHERE topics CONTAINS $topic
            AND archived != true
            ORDER BY time DESC
            FETCH user, replyTo, images
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Post>()

    let threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time,
                topics, quote, replies, votes, score,
                edited, timeEdited, visits, images
            FROM thread
            WHERE topics CONTAINS $topic
            AND replyTo = NONE
            ORDER BY time DESC
            FETCH user, quote, quote.user, images
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Post>()

    return sortList([...posts, ...threads], query.sortBy)
})