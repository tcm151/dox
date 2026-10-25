import type { Thread } from "@@/shared/types"

type CreateThreadRequest = {
    content: string
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const thread = await readBody<CreateThreadRequest>(event)
    const imageIds = thread.images ?? []

    return await new DatabaseQuery()
        .addSql(`
            LET $attachableImages = (
                SELECT VALUE id
                FROM image
                WHERE id IN $images
                AND (user = $user OR public = true)
            );

            IF array::len($attachableImages) != array::len($images) {
                fn::http(403, "You are not allowed to attach these images.");
            };

            RETURN CREATE thread SET
                user = $user,
                content = $content,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addRecords('topics', thread.topics)
        .addRecords('images', imageIds)
        .queryOne<Thread>()
})