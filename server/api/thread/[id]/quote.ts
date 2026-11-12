import type { Thread } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!
    let thread = await readBody<Thread>(event)
    const quoteId = `thread:${id}`

    const { quote, recipient } = await new DatabaseQuery()
        .addSql(`
            LET $locked = (SELECT VALUE locked FROM ONLY moderation WHERE subject = $quote LIMIT 1);
            IF $locked != NONE {
                fn::http(409, "This thread is locked and cannot be quoted.");
            };

            LET $recipient = $quote.user;
            LET $quoted = (
                CREATE ONLY thread SET
                    user = $user,
                    content = $content,
                    tags = $tags,
                    topics = $topics,
                    quote = $quote,
                    votes.positive = [$user]
            );

            RETURN { quote: $quoted, recipient: $recipient };
        `)
        .addTransaction()
        .addRecord('user', auth.id)
        .addParameter('content', thread.content)
        .addParameter('tags', thread.tags ?? [])
        .addRecords('topics', thread.topics ?? [])
        .addRecord('quote', quoteId)
        .queryValue<{ quote: Thread, recipient: string }>()

    await NotificationManager.send({
        recipient,
        context: quote.id,
        message: `**${auth.name}** quoted you\n> ${quote.content}\n`,
    })

    return quote
})