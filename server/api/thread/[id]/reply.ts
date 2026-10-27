import type { Thread } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)

    const { reply, recipient } = await new DatabaseQuery()
        .addSql(`
            LET $reply = (
                CREATE ONLY thread SET
                    user = $user,
                    content = $content,
                    replyTo = $replyTo,
                    votes.positive = [$user]
            );
            LET $recipient = (SELECT VALUE user FROM ONLY $replyTo);
            RETURN { reply: $reply, recipient: $recipient };
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addRecord('replyTo', `thread:${id}`)
        .addParameter('content', thread.content)
        .queryValue<{ reply: Thread, recipient: string }>()

    await NotificationManager.send({
        recipient,
        context: reply.id,
        message: `**${auth.name}** replied to you\n> ${reply.content}\n`,
    })

    return reply
})