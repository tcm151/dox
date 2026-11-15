import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const recipient = await new DatabaseQuery()
        .addSql(`
            IF $link.user = $awarder {
                fn::http(400, "You cannot award your own links.");
            };
            IF $link.votes.awards CONTAINS $awarder {
                fn::http(409, "You have already awarded this link.");
            };
            IF $awarder.tokens < 256 {
                fn::http(409, "You don't have enough tokens.");
            };

            UPDATE $link SET
                votes.awards = array::union(votes.awards, [$awarder]);

            UPDATE $awarder SET
                tokens -= 256;

            UPDATE $link.user SET
                tokens += 256;

            RETURN $link.user;
        `)
        .addTransaction()
        .addRecord("link", `link:${id}`)
        .addRecord("awarder", auth.id)
        .queryValue<string>()

    await NotificationManager.send({
        recipient,
        context: `link:${id}`,
        message: `**${auth.name}** awarded your link\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})