import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)

    return await new DatabaseQuery()
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
})