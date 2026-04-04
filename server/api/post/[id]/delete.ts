export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $post.user != $user.id AND $user.roles CONTAINSNOT "admin" {
                    THROW "You are not allowed to do this.";
                };
                FOR $topic IN $post.topics {
                    UPDATE $topic SET
                        posts -= $post;
                };
                FOR $image IN $post.images {
                    UPDATE $post.user SET
                        tokens += $image.tokens;
                    DELETE $image;
                };
                IF array::len($post.comments) > 0 {
                    UPDATE $post SET
                        content = "[deleted]",
                        deleted = true;
                }
                ELSE {
                    DELETE $post;
                };
            };
        `)
        .addRecord("post", `post:${id}`)
        .addParameter("user", auth.id)
        .execute()
})