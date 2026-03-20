import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, active, time,
            user.id, user.name,
            post.id, post.user.id, post.user.name, post.title, post.time,
            post.replyTo.id, post.replyTo.title, post.topics, post.comments, post.votes,
            post.images
            FROM pin
            FETCH user, post, post.images;
        `)
        .queryAll<Pin>()
})