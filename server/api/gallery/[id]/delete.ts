export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $gallery.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };

            LET $topics = $gallery.topics;
            DELETE ONLY $gallery;
            FOR $topic IN $topics {
                IF record::exists($topic) {
                    IF $topic.posts.len() = 0 AND $topic.threads.len() = 0 AND $topic.galleries.len() = 0 {
                        DELETE $topic;
                    };
                };
            };
        `)
        .addTransaction()
        .addRecord("gallery", `gallery:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})