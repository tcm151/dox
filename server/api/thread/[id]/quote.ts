import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)

    const quote = await new DatabaseQuery()
        .addSql(`
            CREATE thread SET
            user = $user,
            content = $content,
            topics = $topics,
            quote = $quote,
            votes.positive = [$user]
        `)
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addRecords('topics', thread.topics ?? [])
        .addRecord('quote', `thread:${id}`)
        .queryOne<Thread>()

    await new DatabaseQuery()
        .addSql(`
            CREATE notification SET
            recipient = $thread.user,
            context = $context,
            message = $message    
        `)
        .addRecord("thread", `thread:${id}`)
        .addRecord("context", quote.id)
        .addParameter("message", `**${auth.name}** quoted you\n> ${quote.content}\n`)
        .execute()

    return quote
})