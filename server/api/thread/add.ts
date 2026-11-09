import type { Thread } from "@@/shared/types"
import { ModerationManager } from "@@/server/utils/ModerationManager"

type CreateThreadRequest = {
    content: string
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const thread = await readBody<CreateThreadRequest>(event)
    const imageIds = thread.images ?? []

    await ModerationManager.checkTopicCooldown(auth.id, thread.topics)

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