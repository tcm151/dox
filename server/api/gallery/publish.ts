import { Validator } from "@@/shared/utils/Validator"
import { SettingsManager } from "@@/server/utils/SettingsManager"

type PublishGalleryRequest = {
    images: string[]
    title: string
    description: string
    tags?: string[]
    topics: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")

    const settings = await SettingsManager.get()
    if (!settings.media.images.enabled || !settings.media.gallery.enabled) {
        throw createError({ statusCode: 403, statusMessage: "Gallery publishing is disabled." })
    }

    const body = await readBody<PublishGalleryRequest>(event)

    new Validator("Gallery")
        .string(body.title, "title", { minLength: 4, maxLength: 128 })
        .string(body.description, "description", { maxLength: 256 })
        .confirm()

    if (!Array.isArray(body.images) || body.images.length === 0) {
        throw createError({ statusCode: 400, statusMessage: "A gallery must contain at least one image." })
    }

    await ModerationManager.checkTopicCooldown(auth.id, body.topics)

    await new DatabaseQuery()
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
                IF !record::exists($image) {
                    fn::http(404, "One or more images do not exist.");
                };
                IF $image.user != $user OR $image.status != "active" {
                    fn::http(403, "You can only publish your own available images.");
                };
            };

            CREATE gallery SET
                user = $user,
                title = $title,
                description = $description,
                tags = $tags,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
            .addTransaction()
        .addRecords("images", body.images)
        .addRecords("topics", body.topics)
        .addParameter("title", body.title)
        .addParameter("description", body.description)
        .addParameter("tags", body.tags ?? [])
        .addRecord("user", auth.id)
        .execute()

    return true
})