export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $gallery.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };

            FOR $topic IN $gallery.topics {
                IF record::exists($topic) {
                    UPDATE $topic SET galleries = array::difference(galleries, [$gallery.id]);
                };
            };
            DELETE ONLY $gallery;
        `)
        .addTransaction()
        .addRecord("gallery", `gallery:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})