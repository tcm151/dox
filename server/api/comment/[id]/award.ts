import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const awarder = await authenticateRequest(event)
    const { id } = event.context.params!

    const recipient = await new DatabaseQuery()
        .addSql(`
            IF $comment.user = $awarder {
                fn::http(400, "You cannot award your own comments.");
            };
            IF $comment.votes.awards CONTAINS $awarder {
                fn::http(409, "You have already awarded this comment.");
            };
            IF $awarder.tokens < 256 {
                fn::http(409, "You don't have enough tokens.");
            };

            UPDATE $comment SET
                votes.awards = array::union(votes.awards, [$awarder]);

            UPDATE $awarder SET
                tokens -= 256;

            UPDATE $comment.user SET
                tokens += 256;

            RETURN $comment.user;
        `)
        .addTransaction()
        .addRecord("comment", `comment:${id}`)
        .addRecord("awarder", awarder.id)
        .queryValue<string>()

    await NotificationManager.send({
        recipient,
        context: `comment:${id}`,
        message: `**${awarder.name}** awarded your comment\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})