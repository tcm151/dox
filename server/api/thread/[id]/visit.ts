import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const thread = await new DatabaseQuery()
        .addSql(`
            UPDATE $thread SET
            visits += 1
        `)
        .addRecord("thread", `thread:${id}`)
        .queryOne<Thread>()

    return thread.visits
})