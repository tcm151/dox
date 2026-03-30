import type { Post } from "@@/shared/types"

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
        .addRecord("post", `post:${id}`)
        .addRecord("user", auth.id)
        .addParameter("content", content)
        .queryOne<Post>()
})