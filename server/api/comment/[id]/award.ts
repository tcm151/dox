import { NotificationManager } from "@@/server/utils/repos/NotificationManager"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const awarder = await authenticateRequest(event)
    const { id } = event.context.params!
    const blockedUsers = await UserSettingsManager.getBlockedUsers(awarder)
    const blockedTopics = await UserSettingsManager.getBlockedTopics(awarder)

    const recipient = await new DatabaseQuery()
        .addSql(`
            IF $blockedUsers.len() > 0 AND $blockedUsers CONTAINS $comment.user {
                fn::http(403, "Users cannot award each other while either user blocks the other.");
            };
            LET $topics = $comment.context.topics ?? [];
            IF $blockedTopics.len() > 0 AND $blockedTopics CONTAINSANY $topics {
                fn::http(403, "You cannot award content in a topic you have blocked.");
            };
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
        .addRecords("blockedUsers", blockedUsers)
        .addRecords("blockedTopics", blockedTopics)
        .queryValue<string>()

    await NotificationManager.send({
        recipient,
        context: `comment:${id}`,
        message: `**${awarder.name}** awarded your comment\n> You gained 256 tokens. Don't forget to thank them!\n`,
    })
})