import type { Draft } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody(event)
    const imageIds = (draft.images ?? []) as string[]

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

            RETURN CREATE draft SET
                user = $user,
                title = $title,
                content = $content,
                replyTo = $replyTo ?? NONE,
                topics = $topics,
                images = $images;
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('title', draft.title)
        .addParameter('content', draft.content)
        .addRecord('replyTo', draft.replyTo, true)
        .addRecords('topics', draft.topics)
        .addRecords('images', imageIds)
        .queryOne<Draft>()
})