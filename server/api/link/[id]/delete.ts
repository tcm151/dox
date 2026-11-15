export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $link.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };

            LET $topics = $link.topics;
            DELETE pin WHERE item = $link;
            
            IF $link.comments.len() > 0 {
                UPDATE $link SET
                    url = "",
                    description = "[deleted]",
                    preview = {},
                    tags = [],
                    topics = [],
                    status = "deleted";
            }
            ELSE {
                DELETE ONLY $link;
            };

            FOR $topic IN $topics {
                IF record::exists($topic) {
                    IF $topic.posts.len() = 0 AND $topic.threads.len() = 0 AND $topic.galleries.len() = 0 AND $topic.links.len() = 0 {
                        DELETE $topic;
                    };
                };
            };
        `)
        .addTransaction()
        .addRecord("link", `link:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})