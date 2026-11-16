import type { Thread } from "@@/shared/types"
import { THREAD_DISPLAY_LIMIT } from "@@/server/utils/thread"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const thread = await new DatabaseQuery()
        .addSql(`
            LET $thread = (
                SELECT id, user.{id, name, roles}, content, tags, time,
                    quote.{id, user.{id, name, roles}, content, tags, time, replies, topics, votes, score, status, visits},
                    replyTo.{id}, topics, images.{id, url},
                status, deleted, edited, timeEdited, visits, votes, score, moderation
                FROM ONLY $thread
            );
            IF $thread = NONE {
                fn::http(404, "Thread not found.");
            };

            LET $ancestors = fn::thread_ancestors($thread.id, $displayLimit);
            LET $replyRows = (
                SELECT id, user.{id, name, roles}, content, tags, time, edited, timeEdited, visits, votes, score, status, deleted,
                    replyTo.{id}, moderation, replies
                FROM thread
                WHERE replyTo = $thread.id
                ORDER BY score DESC, id ASC
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