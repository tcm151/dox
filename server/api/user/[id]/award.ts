import { NotificationManager } from "@@/server/utils/repos/NotificationManager"
const awardCost = 256
const maxTokens = 65536

export default defineEventHandler(async (event) => {
    const awarder = await authenticateRequest(event)
    const { id } = event.context.params!
    const targetId = `user:${id}`

    await new DatabaseQuery()
        .addSql(`
            IF !record::exists($target) {
                fn::http(404, "User not found.");
            };
            IF $target = $awarder {
                fn::http(400, "You cannot award yourself.");
            };
            IF $target.votes.awards CONTAINS $awarder {
                fn::http(409, "You have already awarded this user.");
            };
            IF $awarder.tokens < $awardCost {
                fn::http(409, "You do not have enough tokens.");
            };
            IF $target.tokens + $awardCost > $maxTokens {
                fn::http(409, "This user cannot receive more tokens.");
            };

            UPDATE $target SET
                votes.awards = array::union(votes.awards, [$awarder]),
                tokens += $awardCost;
            UPDATE $awarder SET
                tokens -= $awardCost;

        `)
        .addTransaction()
        .addRecord("target", targetId)
        .addRecord("awarder", awarder.id)
        .addParameter("awardCost", awardCost)
        .addParameter("maxTokens", maxTokens)
        .execute()

    await NotificationManager.send({
        recipient: targetId,
        context: targetId,
        message: `**${awarder.name}** awarded you 256 tokens. Don't forget to thank them!`,
    })

    return { awarded: true }
})