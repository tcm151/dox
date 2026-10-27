import type { Thread } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const thread = await new DatabaseQuery()
        .addSql(`
            IF $thread.user = $awarder {
                fn::http(400, "You cannot award your own threads...");
            };
            IF $thread.votes.awards CONTAINS $awarder {
                fn::http(409, "You have already awarded this thread.");
            };
            IF $awarder.tokens < 256 {
                fn::http(409, "You don't have enough tokens.");
            };

            UPDATE $thread SET
                votes.awards = array::union(votes.awards, [$awarder]);

            UPDATE $awarder SET
                tokens -= 256;

            UPDATE $thread.user SET
                tokens += 256;

            RETURN SELECT *
            FROM $thread;
        `)
        .addTransaction()
        .addRecord("thread", `thread:${id}`)
        .addRecord("awarder", auth.id)
        .queryOne<Thread>()

    await NotificationManager.send({
        recipient: thread.user,
        context: thread.id,
        message: `**${auth.name}** awarded your thread\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })

    return thread
})