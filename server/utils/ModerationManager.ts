import type { Moderation } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

type ControlState = Pick<Moderation, "locked" | "slowed">[]

export class ModerationManager {
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

    static async lockContent(targetId: string, userId: string, scope: unknown) {
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

    static async unlockContent(targetId: string, userId: string) {
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

    static async lockTopic(topicId: string, userId: string) {
        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($topic) {
                    fn::http(404, "Topic not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    fn::http(403, "Only admins can lock topics.");
                };

                LET $status = SELECT VALUE status FROM ONLY $topic;
                IF $status != "active" {
                    fn::http(409, "This topic is not active.");
                };

                UPDATE $topic SET status = "locked";
                CREATE moderatorLog SET
                    actor = $user,
                    action = "moderation.topic.locked",
                    target = $topic,
                    details = { status: { before: $status, after: "locked" } };
            `)
            .addTransaction()
            .addRecord("topic", topicId)
            .addRecord("user", userId)
            .execute()

        return { topic: topicId, status: "locked" as const }
    }

    static async unlockTopic(topicId: string, userId: string) {
        await new DatabaseQuery()
            .addSql(`
                IF !record::exists($topic) {
                    fn::http(404, "Topic not found.");
                };
                IF $user.roles CONTAINSNOT "admin" {
                    fn::http(403, "Only admins can unlock topics.");
                };

                LET $status = SELECT VALUE status FROM ONLY $topic;
                IF $status != "locked" {
                    fn::http(409, "This topic is not locked.");
                };

                UPDATE $topic SET status = "active";
                CREATE moderatorLog SET
                    actor = $user,
                    action = "moderation.topic.unlocked",
                    target = $topic,
                    details = { status: { before: $status, after: "active" } };
            `)
            .addTransaction()
            .addRecord("topic", topicId)
            .addRecord("user", userId)
            .execute()

        return { topic: topicId, status: "active" as const }
    }

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

    static async removeModeratorFromTopic(topicId: string, moderatorId: string, actorId: string) {
        await new DatabaseQuery()
            .addSql(`
                IF $actor.roles CONTAINSNOT "admin" {
                    fn::http(403, "Only admins can remove topic moderators.");
                };
                IF !record::exists($topic) {
                    fn::http(404, "Topic not found.");
                };
                IF !record::exists($moderator) {
                    fn::http(404, "User not found.");
                };
                IF $topic.moderators CONTAINSNOT $moderator {
                    fn::http(409, "This user is not a moderator of the topic.");
                };

                UPDATE $topic SET moderators -= $moderator;
                LET $remainingAssignments = SELECT VALUE id
                    FROM topic
                    WHERE moderators CONTAINS $moderator;
                LET $removeGlobalRole = $remainingAssignments.len() = 0
                    AND $moderator.roles CONTAINS "moderator";

                IF $removeGlobalRole {
                    UPDATE $moderator SET
                        roles = array::difference(roles, ["moderator"]);
                };

                CREATE moderatorLog SET
                    actor = $actor,
                    action = "moderation.topic.moderator.removed",
                    target = $topic,
                    details = {
                        moderator: $moderator,
                        globalModeratorRoleRemoved: $removeGlobalRole
                    };
            `)
            .addTransaction()
            .addRecord("topic", topicId)
            .addRecord("moderator", moderatorId)
            .addRecord("actor", actorId)
            .execute()

        return { topic: topicId, moderator: moderatorId }
    }

    static async sendApprovalNotification(approval: { user: string, topic: string }) {
        await NotificationManager.send({
            recipient: approval.user,
            context: approval.topic,
            message: "Your request to moderate this topic was approved.",
        })
    }

    static async reviewApprovals(threshold: number) {
        const approvedRequests = await new DatabaseQuery()
            .addSql(`
                LET $approvals = (
                    SELECT id, user, topic
                    FROM moderationRequest
                    WHERE closed = false
                    AND approvals.len() >= $threshold
                    AND approvals.len() > denials.len()
                );

                FOR $request IN $approvals {
                    UPDATE $request.topic SET
                        moderators = array::union(moderators, [$request.user]);
                    UPDATE $request.user SET
                        roles = array::union(roles, ["moderator"]);
                    UPDATE $request.id SET
                        closed = true;
                };

                UPDATE moderationRequest SET
                    closed = true
                WHERE closed = false
                AND denials.len() >= $threshold
                AND denials.len() > approvals.len();

                RETURN { approvals: $approvals };
            `)
            .addTransaction()
            .addParameter("threshold", threshold)
            .queryValue<{ approvals: { user: string, topic: string }[] }>()

        await Promise.all(approvedRequests.approvals.map(approval =>
            ModerationManager.sendApprovalNotification(approval),
        ))
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