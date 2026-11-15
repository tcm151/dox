import type { Gallery, Link, Post, Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    let query = getQuery<{ sortBy: string }>(event)

    let posts = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, string::slice(content, 0, 512) AS content, tags, time, edited, timeEdited,
                replyTo.id, replyTo.title, replyTo.tags, topics, comments, votes, score,
                status, images.{id, url} AS images, visits, moderation
            FROM post
            WHERE user = $user
            AND status = "active"
            ORDER BY time DESC
            FETCH user, replyTo
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Post>()

    let links = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, description, url, preview, tags, time, edited, timeEdited,
                topics, comments, votes, score, status, visits, moderation
            FROM link
            WHERE user = $user
            AND status = "active"
            ORDER BY time DESC
            FETCH user
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Link>()

    let threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, tags, time,
                topics, quote, replies, votes, score,
                edited, timeEdited, visits, images.{id, url} AS images,
                (SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation
            FROM thread
            WHERE user = $user
            AND replyTo = NONE
            AND status = "active"
            ORDER BY time DESC
            FETCH user, quote, quote.user
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Thread>()

    let galleries = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, description, tags, time,
                topics, images.{id, url} AS images, votes, score, visits, status, moderation
            FROM gallery
            WHERE user = $user
            AND status = "active"
            ORDER BY time DESC
            FETCH user
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Gallery>()

    return sortList([...posts, ...links, ...threads, ...galleries], query.sortBy)
})