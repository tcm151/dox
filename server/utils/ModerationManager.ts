import type { Moderation } from "@@/shared/types"

type ControlState = Pick<Moderation, "locked" | "slowed">[]

export class ModerationManager {
    static async checkTopicCooldown(userId: string, topicIds: string[]): Promise<void> {
        if (topicIds.length === 0) return
        await new DatabaseQuery()
            .addSql(`
                LET $recent = (
                    SELECT topics, time::now() - time AS since
                    FROM post, thread, gallery
                    WHERE user = $user
                    AND topics CONTAINSANY $topics
                    AND time::now() - time < 1h
                );
                FOR $topic IN $topics {
                    IF $recent.any(|$s| $s.topics CONTAINS $topic AND $s.since < duration::from_secs($topic.moderation.maxPostInterval)) {
                        fn::http(429, "You have posted in this topic too recently.");
                    };
                };
            `)
            .addTransaction()
            .addRecord("user", userId)
            .addRecords("topics", topicIds)
            .execute()
    }

    static async getModeration(targetId: string, userId: string): Promise<ControlState> {
        return await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Moderation target not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $user;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                RETURN SELECT locked, slowed
                FROM moderation
                WHERE subject = $target;
            `)
            .addTransaction()
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .queryValue<ControlState>()
    }

    static async lock(targetId: string, userId: string, scope: unknown) {
        if (scope !== "item") {
            throw createError({ statusCode: 400, statusMessage: "A valid lock scope is required." })
        }

        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Moderation target not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $user;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $moderation = (
                    SELECT *
                    FROM ONLY moderation
                    WHERE subject = $target
                    LIMIT 1
                );
                IF $moderation.locked = $scope {
                    fn::http(409, "This content is already locked with that scope.");
                };
                IF $moderation = NONE {
                    CREATE moderation SET
                        subject = $target,
                        locked = $scope;
                }
                ELSE {
                    UPDATE $moderation SET
                        locked = $scope;
                };

                CREATE moderatorLog SET
                    actor = $user,
                    action = "moderation.locked",
                    target = $target,
                    details = { lock: { before: $moderation.locked ?? "unlocked", after: $scope } };
            `)
            .addTransaction()
            .addParameter("scope", scope)
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .execute()

        return { subject: targetId, locked: scope }
    }

    static async unlock(targetId: string, userId: string) {
        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Moderation target not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $user;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $moderation = (
                    SELECT *
                    FROM ONLY moderation
                    WHERE subject = $target
                    LIMIT 1
                );
                IF $moderation.locked = NONE {
                    fn::http(409, "This content is not locked.");
                };
                IF $moderation.slowed = NONE {
                    DELETE $moderation;
                } ELSE {
                    UPDATE $moderation UNSET locked;
                };

                CREATE moderatorLog SET
                    actor = $user,
                    action = "moderation.unlocked",
                    target = $target,
                    details = { lock: { before: $moderation.locked, after: "unlocked" } };
            `)
            .addTransaction()
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .execute()

        return { subject: targetId }
    }

    static async setSlowMode(targetId: string, userId: string, interval: unknown) {
        if (typeof interval !== "number" || !Number.isSafeInteger(interval) || interval <= 0) {
            throw createError({ statusCode: 400, statusMessage: "A valid slow-mode interval is required." })
        }

        if (!targetId.startsWith("post:") && !targetId.startsWith("gallery:") && !targetId.startsWith("thread:")) {
            throw createError({ statusCode: 400, statusMessage: "Slow mode is only supported for discussions." })
        }
        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Moderation target not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $user;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $settings = SELECT * FROM ONLY appSettings:default;
                IF !($settings.moderation.slowModes CONTAINS $interval) {
                    fn::http(400, "This slow-mode interval is not available.");
                };

                LET $moderation = (
                    SELECT *
                    FROM ONLY moderation
                    WHERE subject = $target
                    LIMIT 1
                );
                IF $moderation.slowed != NONE {
                    fn::http(409, "Slow mode is already active. Clear it before setting a new interval.");
                };

                IF $moderation = NONE {
                    CREATE moderation SET
                        subject = $target,
                        slowed = $interval;
                } ELSE {
                    UPDATE $moderation SET
                        slowed = $interval;
                };

                CREATE moderatorLog SET
                    actor = $user,
                    action = "moderation.slow_mode.set",
                    target = $target,
                    details = { slowMode: { before: $moderation.slowed ?? "disabled", after: $interval } };
            `)
            .addTransaction()
            .addParameter("interval", interval)
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .execute()

        return { subject: targetId, slowed: interval }
    }

    static async clearSlowMode(targetId: string, userId: string) {
        if (!targetId.startsWith("post:") && !targetId.startsWith("gallery:") && !targetId.startsWith("thread:")) {
            throw createError({ statusCode: 400, statusMessage: "Slow mode is only supported for discussions." })
        }
        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($target) {
                    fn::http(404, "Moderation target not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $user;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $moderation = (
                    SELECT *
                    FROM ONLY moderation
                    WHERE subject = $target
                    LIMIT 1
                );
                IF $moderation.slowed = NONE {
                    fn::http(409, "Slow mode is not active for this discussion.");
                };
                IF $moderation.locked = NONE {
                    DELETE $moderation;
                } ELSE {
                    UPDATE $moderation UNSET slowed;
                };

                CREATE moderatorLog SET
                    actor = $user,
                    action = "moderation.slow_mode.cleared",
                    target = $target,
                    details = { slowMode: { before: $moderation.slowed, after: "disabled" } };
            `)
            .addTransaction()
            .addRecord("target", targetId)
            .addRecord("user", userId)
            .execute()

        return { subject: targetId }
    }
}