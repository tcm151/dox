import type { Comment } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const body = await readBody(event)
    
    const { comment, recipient } = await new DatabaseQuery()
        .addSql(`
            LET $recipient = (SELECT VALUE user FROM ONLY $replyTo);
            LET $comment = (
                CREATE ONLY comment SET
                    user = $user,
                    post = $post,
                    content = $content,
                    replyTo = $replyTo,
                    votes.positive = [$user]
            );

            RETURN { comment: $comment, recipient: $recipient };
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("post", body.post)
        .addParameter("content", body.content)
        .addRecord("replyTo", body.replyTo)
        .queryValue<{ comment: Comment, recipient: string }>()
    
    await NotificationManager.send({
        recipient,
        context: comment.post,
        message: `**${auth.name}** replied to you\n> ${comment.content}\n`,
    })

    return comment
})