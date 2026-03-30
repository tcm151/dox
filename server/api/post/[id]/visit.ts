import type { Post } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const post = await new DatabaseQuery()
        .addSql(`
            UPDATE $post SET
            visits += 1    
        `)
        .addRecord("post", `post:${id}`)
        .queryOne<Post>()

    return post.visits
})