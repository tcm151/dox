import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, content, time, edited, timeEdited,
            replyTo.id, replyTo.content, topics, votes, visits,
            images,
            (
                SELECT id, user.id, user.name, content, time, edited, timeEdited,
                replyTo.id, replyTo.content, topics, replies, votes, visits,
                images
                FROM $thread.replies
                ORDER BY time DESC
                FETCH user, thread
            ) AS replies
            FROM $thread
            FETCH user, replyTo, images
        `)
        .addRecordId("thread", `thread:${id}`)
        .queryOne<Thread>()
})