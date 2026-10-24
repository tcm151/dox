export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $post.user != $user AND $user.roles CONTAINSNOT "admin" {
                    THROW "You are not allowed to do this.";
                };
                FOR $topic IN $post.topics {
                    UPDATE $topic SET
                        posts -= $post;
                };
                IF array::len($post.comments) > 0 {
                    UPDATE $post SET
                        content = "[deleted]",
                        deleted = true;
                }
                ELSE {
                    FOR $image IN $post.images {
                        IF $image.user = $post.user AND $image.public = false {
                            LET $usages = SELECT VALUE id
                                FROM post, thread, draft
                                WHERE images CONTAINS $image
                                AND id != $post.id;
                            IF array::len($usages) = 0 {
                                LET $deletedImage = DELETE ONLY $image RETURN BEFORE;
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
            };
        `)
        .addRecord("post", `post:${id}`)
        .addRecord("user", auth.id)
        .execute()
})