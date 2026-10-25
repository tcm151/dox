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
    const imageIds = post.images ?? []

    return await new DatabaseQuery()
        .addSql(`
            LET $attachableImages = (
                SELECT VALUE id
                FROM image
                WHERE id IN $images
                AND (user = $user OR public = true)
            );

            IF array::len($attachableImages) != array::len($images) {
                fn::http(403, "You are not allowed to attach these images.");
            };

            RETURN CREATE post SET
                user = $user,
                title = $title,
                content = $content,
                replyTo = $replyTo ?? NONE,
                topics = $topics,
                images = $images,
                votes.positive = [$user];
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addParameter("title", post.title)
        .addParameter("content", post.content)
        .addRecord('replyTo', post.replyTo ?? "", true)
        .addRecords("topics", post.topics)
        .addRecords("images", imageIds)
        .queryOne<Post>()
})