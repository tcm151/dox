import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)

    const reply = await new DatabaseQuery()
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
            CREATE notification SET
            recipient = $thread.user,
            context = $context,
            message = $message    
        `)
        .addRecord("thread", `thread:${id}`)
        .addRecord("context", reply.id)
        .addParameter("message", `**${auth.name}** replied to you\n> ${reply.content}\n`)
        .execute()

    return reply
})