import type { Post } from "@@/shared/types"

type CreatePostRequest = {
    title: string
    content: string
    replyTo?: string
    topics: string[]
    images?: string[]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const post = await readBody<CreatePostRequest>(event)

    return await new DatabaseQuery()
        .addSql(`
            CREATE post SET
                user = $user,
                title = $title,
                content = $content,
                replyTo = $replyTo ?? NONE,
                topics = $topics,
                images = $images,
                votes.positive = [$user]
        `)
        .addRecord("user", auth.id)
        .addParameter("title", post.title)
        .addParameter("content", post.content)
        .addRecord('replyTo', post.replyTo ?? "", true)
        .addRecords("topics", post.topics)
        .addRecords("images", post.images ?? [])
        .queryOne<Post>()
})