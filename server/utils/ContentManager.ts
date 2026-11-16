import type { Pin, User } from "@@/shared/types"
import { parseRecordId } from "@@/shared/utils/records"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

const awardCost = 256
type AwardedContent = { id: string, user: string }

export class ContentManager {
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

    static async archive<T = unknown>(targetId: string): Promise<T> {
        const target = this.validateTarget(targetId, "archived")

        return await new DatabaseQuery()
            .addSql(`
                IF $target.status NOT IN ["active", "archived"] {
                    fn::http(409, "This ${target.table} cannot be archived in its current state.");
                };
                UPDATE $target SET
                    status = IF status = "archived" THEN "active" ELSE "archived" END;
                RETURN SELECT * FROM $target;
            `)
            .addTransaction()
            .addRecord("target", targetId)
            .queryOne<T>()
    }

    static async pin(targetId: string, userId: string): Promise<Pin> {
        this.validateTarget(targetId, "pinned")

        return await new DatabaseQuery()
            .addSql(`
                CREATE pin SET
                    item = $target,
                    scope = "app",
                    user = $user;
            `)
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .queryOne<Pin>()
    }

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

        return { saved: true }
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

        return { saved: false }
    }

    private static validateTarget(targetId: string, action = "saved") {
        const target = parseRecordId(targetId)
        if (!target || !["post", "link", "thread", "gallery"].includes(target.table)) {
            throw createError({ statusCode: 400, statusMessage: `This content type cannot be ${action}.` })
        }

        return target
    }
}