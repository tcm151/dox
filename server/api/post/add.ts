import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let post = await readBody<Post>(event)



    return await new DatabaseQuery()
        .addSql(`
            CREATE post SET
            user = $user,
            title = $title,
            content = $content,
            // replyTo = $replyTo,
            topics = $topics,
            images = $images,
            votes.positive = [$user]
        `)
        .addRecord("user", auth.id)
        .addParameter("title", post.title)
        .addParameter("content", post.content)
        // .addRecord("replyTo", post.replyTo ?? undefined)
        .addRecords("topics", post.topics)
        .addRecords("images", post.images as string[])
        .queryOne<Post>()
})