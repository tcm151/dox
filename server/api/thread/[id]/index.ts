import type { Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    let thread = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $thread
            FETCH user, replyTo, replyTo.user, quote, quote.user, images, replies, replies.user
        `)
        .addRecord("thread", `thread:${id}`)
        .queryOne<Thread>()

    for (let reply of thread.replies) {

        reply.chain = []
        let current = reply.id

        for (let i = 0; i < 10; i++) {
            try {
                const next = await new DatabaseQuery()
                    .addSql(`
                        SELECT *
                        FROM thread
                        WHERE replyTo = $thread
                        ORDER BY score DESC
                        LIMIT 1
                        FETCH user
                    `)
                    .addRecord("thread", current)
                    .queryOne<Thread>()
        
                reply.chain.push(next)
                current = next.id
            }
            catch (error: any) {
                break
            }
        }
    }

    thread.replies = sortList(thread.replies as Thread[], "top") as (Thread & string)[]
    return thread
})