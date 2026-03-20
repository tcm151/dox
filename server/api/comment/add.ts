import type { Comment } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let comment = await readBody(event)
    
    comment = await new DatabaseQuery()
        .addSql(`
            CREATE comment SET
            user = $user,
            post = $post,
            content = $content,
            replyTo = $replyTo,
            votes.positive = [$user]
        `)
        .addRecordId("user", auth.id)
        .addRecordId("post", comment.post)
        .addParameter("content", comment.content)
        .addRecordId("replyTo", comment.replyTo)
        .queryOne<Comment>()
    
    await new DatabaseQuery()
        .addSql(`
            CREATE notification SET
            recipient = $recipient.user,
            context = $context,
            message = $message    
        `)
        .addRecordId("recipient", comment.replyTo)
        .addRecordId("context", comment.post)
        .addParameter("message", `**${auth.name}** replied to you\n> ${comment.content}\n`)
        .execute()

    return comment
})