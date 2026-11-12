import type { Thread } from "@@/shared/types"
import { THREAD_DISPLAY_LIMIT } from "@@/server/utils/thread"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const thread = await new DatabaseQuery()
        .addSql(`
            LET $thread = (
                SELECT id, user, content, tags, time, quote, replyTo, topics, images,
                status, deleted, edited, timeEdited, visits, votes, score, moderation
                FROM ONLY $thread
                FETCH user, replyTo, replyTo.user, quote, quote.user, images.url
            );
            IF $thread = NONE {
                fn::http(404, "Thread not found.");
            };

            LET $ancestors = fn::thread_ancestors($thread.id, $displayLimit);
            LET $replyRows = (
                SELECT id, user, content, tags, time, edited, timeEdited, visits, votes, score, status, deleted, replyTo, moderation, replies
                FROM thread
                WHERE replyTo = $thread.id
                ORDER BY score DESC, id ASC
                FETCH user
            );
            LET $replies = fn::thread_replies($replyRows, $displayLimit);
            RETURN object::extend($thread, {
                ancestors: $ancestors,
                quotes: (SELECT VALUE id FROM thread WHERE quote = $thread.id),
                replies: $replies
            });
        `)
        .addTransaction()
        .addRecord("thread", `thread:${id}`)
        .addParameter("displayLimit", THREAD_DISPLAY_LIMIT)
        .queryValue<Thread>()

    return thread
})