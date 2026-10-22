import type { Thread } from "@@/shared/types"

type CreateThreadRequest = {
    content: string
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const thread = await readBody<CreateThreadRequest>(event)

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