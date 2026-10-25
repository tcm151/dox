export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $comment.user != $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You are not allowed to do this.");
            };
            LET $replies = (
                SELECT VALUE id
                FROM comment
                WHERE replyTo = $comment
            );
            IF array::len($replies) > 0 {
                UPDATE $comment SET
                    content = "[deleted]",
                    deleted = true;
            }
            ELSE {
                UPDATE $comment.post SET comments -= $comment;
                DELETE $comment;
            };
        `)
        .addTransaction()
        .addRecord("comment", `comment:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})