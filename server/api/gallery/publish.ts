// import { ModerationManager } from "@@/server/utils/ModerationManager"

type PublishGalleryRequest = {
    images: string[]
    description: string
    tags?: string[]
    topics: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")

    const body = await readBody<PublishGalleryRequest>(event)
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
                description = $description,
                tags = $tags,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
            .addTransaction()
        .addRecords("images", body.images)
        .addRecords("topics", body.topics)
        .addParameter("description", body.description)
        .addParameter("tags", body.tags ?? [])
        .addRecord("user", auth.id)
        .execute()

    return true
})