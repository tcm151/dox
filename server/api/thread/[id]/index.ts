import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $thread
            FETCH user, replyTo, replyTo.user, images, replies, replies.user
        `)
        .addRecord("thread", `thread:${id}`)
        .queryOne<Thread>()
})