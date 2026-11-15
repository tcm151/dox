import type { Post } from "@@/shared/types"
import { ModerationManager } from "@@/server/utils/ModerationManager"
import { SettingsManager } from "@@/server/utils/SettingsManager"

type CreatePostRequest = {
    title: string
    content: string
    tags?: string[]
    replyTo?: string
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const post = await readBody<CreatePostRequest>(event)
    const imageIds = post.images ?? []
    if (imageIds.length > 0) {
        if (!await SettingsManager.canAttachImages("posts")) {
            throw createError({ statusCode: 403, statusMessage: "Image attachments to posts and replies are disabled." })
        }
    }
    await ModerationManager.checkTopicCooldown(auth.id, post.topics)

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

            RETURN CREATE post SET
                user = $user,
                title = $title,
                content = $content,
                tags = $tags,
                replyTo = $replyTo ?? NONE,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addParameter("title", post.title)
        .addParameter("content", post.content)
        .addParameter("tags", post.tags ?? [])
        .addRecord('replyTo', post.replyTo ?? "", true)
        .addRecords("topics", post.topics)
        .addRecords("images", imageIds)
        .queryOne<Post>()
})