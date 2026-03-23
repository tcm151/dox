export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            RETURN {
                IF $thread.user != $user AND $user.roles CONTAINSNOT "admin" {
                    THROW "You are not allowed to do this.";
                };
                FOR $topic IN $thread.topics {
                    UPDATE $topic SET
                        posts -= $thread;
                };
                IF array::len($thread.replies) > 0 || $thread.replyTo != NONE || $thread.quote != NONE {
                    UPDATE $thread SET
                        content = "[deleted]",
                        deleted = true;
                }
                ELSE {
                    DELETE $thread;
                };
            };
        `)
        .addRecord("thread", `thread:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})