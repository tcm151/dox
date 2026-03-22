import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)

    thread = await new DatabaseQuery()
        .addSql(`
            CREATE thread SET
            user = $user,
            content = $content,
            replyTo = $replyTo,
            votes.positive = [$user]
        `)
        .addRecord('user', auth.id)
        .addRecord('replyTo', `thread:${id}`)
        .addParameter('content', thread.content)
        .queryOne<Thread>()

    await new DatabaseQuery()
        .addSql(`
            UPDATE $thread
            SET replies += $reply
        `)
        .addRecord('thread', `thread:${id}`)
        .addRecord('reply', thread.id)
        .queryOne<Thread>()

    return thread
})