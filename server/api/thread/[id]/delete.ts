export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $thread.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };
            LET $topics = $thread.topics;
            IF array::len($thread.replies) > 0 || $thread.replyTo != NONE || $thread.quote != NONE {
                UPDATE $thread SET
                    content = "[deleted]",
                    deleted = true,
                    topics = [];
            }
            ELSE {
                DELETE $thread;
            };
            FOR $topic IN $topics {
                IF record::exists($topic) {
                    IF $topic.posts.len() = 0 AND $topic.threads.len() = 0 AND $topic.galleries.len() = 0 {
                        DELETE $topic;
                    };
                };
            };
        `)
        .addTransaction()
        .addRecord("thread", `thread:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})