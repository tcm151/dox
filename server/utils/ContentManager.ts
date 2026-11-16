import type { User } from "@@/shared/types"
import { parseRecordId } from "@@/shared/utils/records"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

const awardCost = 256
type AwardedContent = { id: string, user: string }

export class ContentManager {
    private static validateTarget(targetId: string, action = "saved") {
        const target = parseRecordId(targetId)
        if (!target || !["post", "link", "thread", "gallery"].includes(target.table)) {
            throw createError({ statusCode: 400, statusMessage: `This content type cannot be ${action}.` })
        }

        return target
    }
    
    static async visit(targetId: string): Promise<number> {
        const target = await new DatabaseQuery()
            .addSql(`
                UPDATE $target SET
                    visits += 1
            `)
            .addRecord("target", targetId)
            .queryOne<{ visits: number }>()

        return target.visits
    }

    static async archive(targetId: string): Promise<boolean> {
        const target = this.validateTarget(targetId, "archived")

        await new DatabaseQuery()
            .addSql(`
                IF $target.status NOT IN ["active", "archived"] {
                    fn::http(409, "This ${target.table} cannot be archived in its current state.");
                };
                UPDATE $target SET
                    status = IF status = "archived" THEN "active" ELSE "archived" END;
            `)
            .addTransaction()
            .addRecord("target", targetId)
            .execute()

        return true
    }

    static async pin(targetId: string, userId: string): Promise<boolean> {
        this.validateTarget(targetId, "pinned")

        await new DatabaseQuery()
            .addSql(`
                CREATE pin SET
                    item = $target,
                    scope = "app",
                    user = $user;
            `)
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .execute()

        return true
    }

    static async award(targetId: string, awarder: User): Promise<boolean> {
        const targetType = parseRecordId(targetId)
        if (!targetType) throw createError({ statusCode: 400, statusMessage: "This content type cannot be awarded." })

        await UserSettingsManager.isBlocked(awarder, targetId)

        const target = await new DatabaseQuery()
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
            .queryOne<AwardedContent>()

        await NotificationManager.send({
            recipient: target.user,
            context: target.id,
            message: `**${awarder.name}** awarded your ${targetType.table}\n> You gained 256 tokens. Don't forget to thank them!\n`,
        })

        return true
    }

    static async save(targetId: string, userId: string) {
        const target = this.validateTarget(targetId)

        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Content not found.");
                };
                UPDATE $target SET
                    votes.saves = array::union(votes.saves, [$user]);
            `)
            .addTransaction()
            .addRecord("target", `${target.table}:${target.id}`)
            .addRecord("user", userId)
            .execute()

        return true
    }

    static async unsave(targetId: string, userId: string) {
        const target = this.validateTarget(targetId)

        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Content not found.");
                };
                IF $target.votes.saves CONTAINS $user {
                    UPDATE $target SET
                        votes.saves = array::difference(votes.saves, [$user]);
                };
            `)
            .addTransaction()
            .addRecord("target", `${target.table}:${target.id}`)
            .addRecord("user", userId)
            .execute()

        return true
    }
}