import type { Thread } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!
    const thread = await readBody<Pick<Thread, "content"> & { tags?: string[] }>(event)
    const replyTo = `thread:${id}`

    const { reply, recipient } = await new DatabaseQuery()
        .addSql(`
            LET $replyTarget = (SELECT id, user FROM ONLY $replyTo);
            IF $replyTarget = NONE {
                fn::http(404, "Thread not found.");
            };

            LET $replyModeration = (SELECT * FROM ONLY moderation WHERE subject = $replyTo LIMIT 1);
            IF $replyModeration.locked != NONE {
                fn::http(409, "Replies are locked for this thread.");
            };

            IF $replyModeration.slowed != NONE {
                LET $lastSubmission = (
                    SELECT VALUE time
                    FROM ONLY thread
                    WHERE user = $user
                    AND replyTo = $replyTo
                    ORDER BY time DESC
                    LIMIT 1
                );
                IF $lastSubmission != NONE AND time::unix($lastSubmission) + $replyModeration.slowed > time::unix(time::now()) {
                    fn::http(429, "Slow mode is active for this thread.");
                };
            };

            LET $reply = (
                CREATE ONLY thread SET
                    user = $user,
                    content = $content,
                    tags = $tags,
                    replyTo = $replyTo,
                    votes.positive = [$user]
            );
            RETURN { reply: $reply, recipient: $replyTarget.user };
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addRecord('replyTo', replyTo)
        .addParameter('content', thread.content)
        .addParameter('tags', thread.tags ?? [])
        .queryValue<{ reply: Thread, recipient: string }>()

    await NotificationManager.send({
        recipient,
        context: reply.id,
        message: `**${auth.name}** replied to you\n> ${reply.content}\n`,
    })

    return reply
})