import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, content, time,
            replyTo.id, replyTo.title, topics, votes, archived, edited, timeEdited, visits,
            images,
            (
                SELECT id, time, user.id, user.name, post.id,
                replyTo, content, votes, edited, deleted, timeEdited
                FROM ($post).comments
                ORDER BY time DESC
                FETCH user, post
            ) AS comments
            FROM $post
            FETCH user, replyTo, images
        `)
        .addRecordId("post", `post:${id}`)
        .queryOne<Post>()
})