import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let thread = await readBody<Thread>(event)
    thread.user = auth.id
    thread.votes.positive = [auth.id]

    return await new DatabaseQuery()
        .addSql(`
            CREATE thread
            CONTENT $thread
        `)
        .addParameter('thread', thread)
        .queryOne<Thread>()
})