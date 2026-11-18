import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string }>(event)
    const { id } = event.context.params!

    const post = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, title, content, tags, time, score,
            replyTo.{id, title, tags}, topics, votes, status, edited, timeEdited, visits,
            images.{id, url}, moderation,
            (
                SELECT id, time, user.{id, name, roles}, context,
                    replyTo, content, votes, score, edited, deleted, status, timeEdited, moderation
                FROM $post.comments
                ORDER BY time DESC
            ) AS comments
            FROM $post
        `)
        .addRecord("post", `post:${id}`)
        .queryOne<Post>()

    post.comments = sortList(post.comments, query.sortBy)
    return post
})