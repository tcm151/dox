import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let thread = await readBody<Thread>(event)
    thread.user = auth.id
    thread.votes.positive = [auth.id]

    thread = await new DatabaseQuery()
        .addSql('CREATE thread CONTENT $thread')
        .addParameter('thread', thread)
        .queryOne<Thread>()

    let { id } = event.context.params!
    await new DatabaseQuery()
        .addSql(`
            UPDATE $thread
            SET replies += $reply
        `)
        .addRecordId('thread', `thread:${id}`)
        .addRecordId('reply', thread.id)
        .queryOne<Thread>()

    return thread
})