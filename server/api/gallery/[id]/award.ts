import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const recipient = await new DatabaseQuery()
        .addSql(`
            IF $gallery.user = $awarder {
                fn::http(400, "You cannot award your own galleries.");
            };
            IF $gallery.votes.awards CONTAINS $awarder {
                fn::http(409, "You have already awarded this gallery.");
            };
            IF $awarder.tokens < 256 {
                fn::http(409, "You don't have enough tokens.");
            };

            UPDATE $gallery SET
                votes.awards = array::union(votes.awards, [$awarder]);

            UPDATE $awarder SET
                tokens -= 256;

            UPDATE $gallery.user SET
                tokens += 256;

            RETURN $gallery.user;
        `)
        .addTransaction()
        .addRecord("gallery", `gallery:${id}`)
        .addRecord("awarder", auth.id)
        .queryValue<string>()

    await NotificationManager.send({
        recipient,
        context: `gallery:${id}`,
        message: `**${auth.name}** awarded your gallery\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})