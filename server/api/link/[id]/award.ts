import { NotificationManager } from "@@/server/utils/repos/NotificationManager"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    const blockedUsers = await UserSettingsManager.getBlockedUsers(auth)
    const blockedTopics = await UserSettingsManager.getBlockedTopics(auth)

    const recipient = await new DatabaseQuery()
        .addSql(`
            IF $blockedUsers.len() > 0 AND $blockedUsers CONTAINS $link.user {
                fn::http(403, "Users cannot award each other while either user blocks the other.");
            };
            IF $blockedTopics.len() > 0 AND $blockedTopics CONTAINSANY $link.topics {
                fn::http(403, "You cannot award content in a topic you have blocked.");
            };
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
        .addRecords("blockedUsers", blockedUsers)
        .addRecords("blockedTopics", blockedTopics)
        .queryValue<string>()

    await NotificationManager.send({
        recipient,
        context: `link:${id}`,
        message: `**${auth.name}** awarded your link\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})