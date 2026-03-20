import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let thread = await readBody<Thread>(event)
    const { id } = event.context.params!

    thread = await new DatabaseQuery()
        .addSql(`
            CREATE thread SET
            user = $user,
            content = $content,
            replyTo = $replyTo,
            topics = $topics,
            images = $images,
            votes.positive = [$user]
        `)
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addRecord('replyTo', `thread:${id}`)
        .addRecords('topics', thread.topics)
        .addRecords('images', thread.images as string[])
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