type PublishGalleryRequest = {
    images: string[]
    description: string
    topics: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")

    const body = await readBody<PublishGalleryRequest>(event)
    if (!Array.isArray(body.images) || body.images.length === 0) {
        throw createError({ statusCode: 400, statusMessage: "A gallery must contain at least one image." })
    }

    await new DatabaseQuery()
        .addSql(`
            FOR $image IN $images {
                IF !record::exists($image) {
                    fn::http(404, "One or more images do not exist.");
                };
                IF $image.user != $user {
                    fn::http(403, "You can only publish your own images.");
                };
                UPDATE $image SET public = true;
            };

            CREATE gallery SET
                user = $user,
                description = $description,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
            .addTransaction()
        .addRecords("images", body.images)
        .addRecords("topics", body.topics)
        .addParameter("description", body.description)
        .addRecord("user", auth.id)
        .execute()

    return true
})