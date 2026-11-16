import type { User } from "@@/shared/types"
import { parseRecordId } from "@@/shared/utils/records"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

const awardCost = 256
type AwardedContent = { id: string, user: string }

export class ContentManager {
    static async award<T extends AwardedContent>(targetId: string, awarder: User): Promise<T> {
        const target = parseRecordId(targetId)
        if (!target) throw createError({ statusCode: 400, statusMessage: "This content type cannot be awarded." })

        await UserSettingsManager.isBlocked(awarder, targetId)

        return await new DatabaseQuery()
            .addSql(`
                IF $target.user = $awarder {
                    fn::http(400, "You cannot award your own content.");
                };
                IF $target.votes.awards CONTAINS $awarder {
                    fn::http(409, "You have already awarded this.");
                };
                IF $awarder.tokens < $awardCost {
                    fn::http(409, "You don't have enough tokens.");
                };

                UPDATE $target SET
                    votes.awards = array::union(votes.awards, [$awarder]);
                UPDATE $awarder SET
                    tokens -= $awardCost;
                UPDATE $target.user SET
                    tokens += $awardCost;

                RETURN SELECT * FROM $target;
            `)
            .addTransaction()
            .addRecord("target", targetId)
            .addRecord("awarder", awarder.id)
            .addParameter("awardCost", awardCost)
            .queryOne<T>()
    }
}
