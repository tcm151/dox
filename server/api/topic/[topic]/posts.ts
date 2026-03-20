import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time,
            replyTo.id, replyTo.title, topics, comments, votes,
            archived, images, visits
            FROM post
            WHERE topics CONTAINS $topic
            FETCH user, replyTo, images
        `)
        .addRecordId("topic", `topic:${topic}`)
        .queryAll<Post>()
})