import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, time, replyTo.id, replyTo.title,
            topics, comments, votes, archived, images, visits
            FROM post
            WHERE user = $user
            ORDER BY time DESC
            FETCH user, images
        `)
        .addRecord("user", `user:${id}`)
        .queryAll<Post>()
})