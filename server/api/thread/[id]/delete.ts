export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $thread.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };
            FOR $topic IN $thread.topics {
                UPDATE $topic SET
                    threads -= $thread;
            };
            IF array::len($thread.replies) > 0 || $thread.replyTo != NONE || $thread.quote != NONE {
                UPDATE $thread SET
                    content = "[deleted]",
                    deleted = true;
            }
            ELSE {
                DELETE $thread;
            };
        `)
        .addTransaction()
        .addRecord("thread", `thread:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})