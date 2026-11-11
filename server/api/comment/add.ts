import type { Comment } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

type CreateCommentRequest = {
    context: string
    content: string
    replyTo: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const body = await readBody<CreateCommentRequest>(event)
    if (!body.context) {
        throw createError({ statusCode: 400, statusMessage: "A post or gallery context is required." })
    }

    const { comment, recipient } = await new DatabaseQuery()
        .addSql(`
            LET $moderation = (SELECT * FROM ONLY moderation WHERE subject = $context LIMIT 1);
            IF $moderation.locked != NONE {
                fn::http(409, "Comments are locked for this discussion.");
            };

            IF record::tb($replyTo) = "comment" {
                LET $replyLock = (SELECT VALUE locked FROM ONLY moderation WHERE subject = $replyTo LIMIT 1);
                IF $replyLock != NONE {
                    fn::http(409, "Replies are locked for this comment.");
                };
            };

            IF $moderation.slowed != NONE {
                LET $lastSubmission = (
                    SELECT VALUE time
                    FROM ONLY comment
                    WHERE context = $context AND user = $user
                    ORDER BY time DESC
                    LIMIT 1
                );
                IF $lastSubmission != NONE AND time::unix($lastSubmission) + $moderation.slowed > time::unix(time::now()) {
                    fn::http(429, "Slow mode is active for this discussion.");
                };
            };

            LET $recipient = (SELECT VALUE user FROM ONLY $replyTo);
            LET $comment = (
                CREATE ONLY comment SET
                    user = $user,
                    context = $context,
                    content = $content,
                    replyTo = $replyTo,
                    votes.positive = [$user]
            );

            RETURN { comment: $comment, recipient: $recipient };
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("context", body.context)
        .addParameter("content", body.content)
        .addRecord("replyTo", body.replyTo)
        .queryValue<{ comment: Comment, recipient: string }>()
    
    await NotificationManager.send({
        recipient,
        context: comment.context,
        message: `**${auth.name}** replied to you\n> ${comment.content}\n`,
    })

    return comment
})