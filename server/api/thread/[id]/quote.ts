import type { Thread } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)

    const { quote, recipient } = await new DatabaseQuery()
        .addSql(`
            LET $recipient = $quote.user;
            LET $quoted = (
                CREATE ONLY thread SET
                    user = $user,
                    content = $content,
                    topics = $topics,
                    quote = $quote,
                    votes.positive = [$user]
            );

            RETURN { quote: $quoted, recipient: $recipient };
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addRecords('topics', thread.topics ?? [])
        .addRecord('quote', `thread:${id}`)
        .queryValue<{ quote: Thread, recipient: string }>()

    await NotificationManager.send({
        recipient,
        context: quote.id,
        message: `**${auth.name}** quoted you\n> ${quote.content}\n`,
    })

    return quote
})