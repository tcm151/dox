import type { Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $thread.user = $awarder {
                    THROW "You cannot award your own threads...";
                };
                IF $thread.votes.awards CONTAINS $awarder {
                    THROW "You have already awarded this thread.";
                };
                
                UPDATE $thread SET
                    votes.awards = array::union(votes.awards, [$awarder]);
                
                UPDATE $awarder SET
                    tokens -= 256;
                
                UPDATE $thread.user SET
                    tokens += 256;

                CREATE notification SET
                    recipient = $thread.user,
                    context = $thread.id,
                    message = $message;

                RETURN SELECT *
                FROM $thread;
            };
        `)
        .addRecord("thread", `thread:${id}`)
        .addRecord("awarder", auth.id)
        .addParameter("message", `**${auth.name}** awarded your thread\n> You gained 256 tokens. Don't forget to thank them!\n`)
        .queryOne<Thread>()
})