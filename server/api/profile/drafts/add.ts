import type { Draft } from "@@/shared/types"

type CreateDraftRequest = {
    title: string
    content: string
    tags?: string[]
    replyTo?: string
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody<CreateDraftRequest>(event)
    const imageIds = draft.images ?? []

    return await new DatabaseQuery()
        .addSql(`
            FOR $image IN $images {
                IF $image.status != "active" {
                    fn::http(403, "You are not allowed to attach these images.");
                };
                IF $image.user != $user {
                    LET $publishedGalleries = (
                        SELECT VALUE id
                        FROM gallery
                        WHERE status = "active" AND images CONTAINS $image
                    );
                    IF array::len($publishedGalleries) = 0 {
                        fn::http(403, "You are not allowed to attach these images.");
                    };
                };
            };

            RETURN CREATE draft SET
                user = $user,
                title = $title,
                content = $content,
                tags = $tags,
                replyTo = $replyTo ?? NONE,
                topics = $topics,
                images = $images;
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('title', draft.title)
        .addParameter('content', draft.content)
        .addParameter('tags', draft.tags ?? [])
        .addRecord('replyTo', draft.replyTo ?? "", true)
        .addRecords('topics', draft.topics)
        .addRecords('images', imageIds)
        .queryOne<Draft>()
})