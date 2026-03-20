import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            CREATE report SET
            subject = $post,
            reporter = $user,
            time = time::now()
        `)
        .addRecord("post", `post:${id}`)
        .addRecord("user", auth.id)
        .queryOne<Post>()
})