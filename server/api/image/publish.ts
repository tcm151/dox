type PublishImagesRequest = {
    images: string[]
    description: string
    topics: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireTrait(auth, "confirmed")

    const body = await readBody<PublishImagesRequest>(event)
    await new DatabaseQuery()
        .addSql(`
            BEGIN TRANSACTION;
            FOR $image IN $images {
                IF !record::exists($image) {
                    THROW "One or more images do not exist.";
                };
                IF $image.user != $user {
                    THROW "You can only publish your own images.";
                };
                UPDATE $image SET
                    description = $description,
                    topics = $topics,
                    public = true;
            };
            COMMIT TRANSACTION;
        `)
        .addRecords("images", body.images)
        .addRecords("topics", body.topics)
        .addParameter("description", body.description)
        .addRecord("user", auth.id)
        .execute()

    return true
})
