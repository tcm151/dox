import type { Post, Comment } from "~/types"

export default defineEventHandler(async (event) => {
    let query = getQuery<{ sortBy: string }>(event)
    const { id } = event.context.params!

    const post = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, content, time,
            replyTo.id, replyTo.title, topics, votes, archived, edited, timeEdited, visits,
            images,
            (
                SELECT id, time, user.id, user.name, post,
                    replyTo, content, votes, score, edited, deleted, timeEdited
                FROM $post.comments
                ORDER BY time DESC
                FETCH user
            ) AS comments
            FROM $post
            FETCH user, replyTo, images
        `)
        .addRecord("post", `post:${id}`)
        .queryOne<Post>()

    post.comments = sortList(post.comments as Comment[], query.sortBy) as (Comment & string)[]
    return post
})