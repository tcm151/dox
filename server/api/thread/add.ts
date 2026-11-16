import type { Thread } from "@@/shared/types"
import { ModerationManager } from "@@/server/utils/ModerationManager"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

type CreateThreadRequest = {
    content: string
    tags?: string[]
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const thread = await readBody<CreateThreadRequest>(event)
    const imageIds = thread.images ?? []
    if (imageIds.length > 0) {
        if (!await SettingsManager.canAttachImages("threads")) {
            throw createError({ statusCode: 403, statusMessage: "Image attachments to threads are disabled." })
        }
    }

    await UserSettingsManager.isBlocked(auth, thread.topics)
    await ModerationManager.checkTopicCooldown(auth.id, thread.topics)

    return await new DatabaseQuery()
        .addSql(`
            LET $unavailableTopics = (
                SELECT VALUE id
                FROM topic
                WHERE id IN $topics AND status != "active"
            );
            IF $unavailableTopics.len() > 0 {
                fn::http(409, "Locked topics cannot be assigned to new content.");
            };

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
                tags = $tags,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addParameter('tags', thread.tags ?? [])
        .addRecords('topics', thread.topics)
        .addRecords('images', imageIds)
        .queryOne<Thread>()
})