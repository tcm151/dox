import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let post = await readBody<Post>(event)
    post.user = auth.id
    post.votes.positive = [auth.id]

    return await new DatabaseQuery()
        .addSql(`
            CREATE post
            CONTENT $post
        `)
        .addParameter('post', post)
        .queryOne<Post>()
})