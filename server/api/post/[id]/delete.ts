export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $post.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };
            LET $topics = $post.topics;
            IF array::len($post.comments) > 0 {
                UPDATE $post SET
                    content = "[deleted]",
                    deleted = true,
                    topics = [];
            }
            ELSE {
                FOR $image IN $post.images {
                    IF $image.user = $post.user AND $image.status = "active" {
                        LET $usages = (
                            SELECT VALUE id
                            FROM post, thread, draft, gallery
                            WHERE images CONTAINS $image
                            AND id != $post.id
                        );
                        IF array::len($usages) = 0 {
                            LET $deletedImage = (
                                DELETE ONLY $image RETURN BEFORE
                            );
                            IF $deletedImage != NONE {
                                UPDATE $post.user SET
                                    tokens += $deletedImage.tokens;
                                CREATE type::record("mediaTrash", $deletedImage.id) SET
                                    type = "image",
                                    extension = $deletedImage.type;
                            };
                        };
                    };
                };
                DELETE $post;
            };
            FOR $topic IN $topics {
                IF record::exists($topic) {
                    IF $topic.posts.len() = 0 AND $topic.threads.len() = 0 AND $topic.galleries.len() = 0 {
                        DELETE $topic;
                    };
                };
            };
        `)
        .addTransaction()
        .addRecord("post", `post:${id}`)
        .addRecord("user", auth.id)
        .execute()
})