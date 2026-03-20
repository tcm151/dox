import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { content } = await readBody<{ content: string }>(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $post.user = $user {
                RETURN UPDATE $post SET
                content = $content,
                edited = true,
                timeEdited = time::now();
            }
            ELSE {
                THROW "You are not the author of this post."
            }
        `)
        .addRecordId("post", `post:${id}`)
        .addRecordId("user", auth.id)
        .addParameter("content", content)
        .queryOne<Post>()
})