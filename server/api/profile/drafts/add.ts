import type { Draft } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody(event)

    // TODO need to fix saving of replyTo field if present
    return await new DatabaseQuery()
        .addSql(`
            CREATE draft SET
            user = $user,
            title = $title,
            content = $content,
            replyTo = $replyTo ?? NONE,
            topics = $topics,
            images = $images
        `)
        .addRecord('user', auth.id)
        .addParameter('title', draft.title)
        .addParameter('content', draft.content)
        .addRecord('replyTo', draft.replyTo, true)
        .addRecords('topics', draft.topics)
        .addRecords('images', draft.images as string[])
        .queryOne<Draft>()
})