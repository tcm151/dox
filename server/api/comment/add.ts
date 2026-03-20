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
        .addRecord("user", auth.id)
        .addRecord("post", comment.post)
        .addParameter("content", comment.content)
        .addRecord("replyTo", comment.replyTo)
        .queryOne<Comment>()
    
    await new DatabaseQuery()
        .addSql(`
            CREATE notification SET
            recipient = $recipient.user,
            context = $context,
            message = $message    
        `)
        .addRecord("recipient", comment.replyTo)
        .addRecord("context", comment.post)
        .addParameter("message", `**${auth.name}** replied to you\n> ${comment.content}\n`)
        .execute()

    return comment
})