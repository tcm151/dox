import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const thread = await readBody<Thread>(event)

    return await new DatabaseQuery()
        .addSql(`
            CREATE thread SET
            user = $user,
            content = $content,
            topics = $topics,
            images = $images,
            votes.positive = [$user]
        `)
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addRecords('topics', thread.topics)
        .addRecords('images', thread.images ?? [])
        .queryOne<Thread>()
})