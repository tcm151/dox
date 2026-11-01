import type { Moderation } from "@@/shared/types"

type LockScope = "item" | "chain"
type LockResult = Pick<Moderation, "subject" | "locked">
type UnlockResult = Pick<Moderation, "subject">

interface LockOptions {
    subjectType: string
    subjectId: string
    actorId: string
    isAdmin: boolean
    scope: unknown
}

interface UnlockOptions {
    subjectType: string
    subjectId: string
    actorId: string
    isAdmin: boolean
}

interface SetSlowModeOptions {
    subjectType: string
    subjectId: string
    actorId: string
    isAdmin: boolean
    interval: unknown
}

interface ClearSlowModeOptions {
    subjectType: string
    subjectId: string
    actorId: string
    isAdmin: boolean
}

type SlowModeResult = Pick<Moderation, "subject" | "slowed">
type ClearSlowModeResult = Pick<Moderation, "subject">

interface ControlStateOptions {
    subjectType: string
    subjectId: string
    actorId: string
    isAdmin: boolean
}

type ControlState = Pick<Moderation, "locked" | "slowed">[]

export class ModerationManager {
    private static getSubject(subjectType: string, subjectId: string, scope?: LockScope): Moderation["subject"] {
        if (!["post", "gallery", "comment", "thread"].includes(subjectType) || !subjectId) {
            throw createError({ statusCode: 400, statusMessage: "A valid moderation subject is required." })
        }
        if (scope === "chain" && subjectType !== "thread") {
            throw createError({ statusCode: 400, statusMessage: "Chain locks are only supported for threads." })
        }

        return `${subjectType}:${subjectId}` as Moderation["subject"]
    }

    static async getControlState(options: ControlStateOptions): Promise<ControlState> {
        const { subjectType, subjectId, actorId, isAdmin } = options
        const subject = this.getSubject(subjectType, subjectId)
        return await new DatabaseQuery()
            .addSql(`
                LET $target = (SELECT * FROM ONLY $subject);
                IF $target = NONE {
                    fn::http(404, "Moderation subject not found.");
                };
                IF !$isAdmin {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic WHERE id IN $topics AND moderators CONTAINS $actor;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                RETURN SELECT locked, slowed
                FROM moderation
                WHERE subject = $subject;
            `)
            .addTransaction()
            .addRecord("subject", subject)
            .addRecord("actor", actorId)
            .addParameter("isAdmin", isAdmin)
            .queryValue<ControlState>()
    }

    static async lock(options: LockOptions): Promise<LockResult> {
        const { subjectType, subjectId, actorId, isAdmin, scope } = options
        if (scope !== "item" && scope !== "chain") {
            throw createError({ statusCode: 400, statusMessage: "A valid lock scope is required." })
        }

        const subject = this.getSubject(subjectType, subjectId, scope)
        await new DatabaseQuery()
            .addSql(`
                LET $target = (SELECT * FROM ONLY $subject);
                IF $target = NONE {
                    fn::http(404, "Moderation subject not found.");
                };
                IF !$isAdmin {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $actor;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $controlId = (SELECT VALUE id FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                LET $previousLock = (SELECT VALUE locked FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                IF $previousLock = $scope {
                    fn::http(409, "This content is already locked with that scope.");
                };

                IF $controlId = NONE {
                    CREATE moderation SET subject = $subject, locked = $scope;
                } ELSE {
                    UPDATE $controlId SET locked = $scope;
                };

                CREATE moderatorLog SET
                    actor = $actor,
                    action = "moderation.locked",
                    target = $subject,
                    details = { lock: { before: $previousLock ?? "unlocked", after: $scope } };
            `)
            .addTransaction()
            .addRecord("subject", subject)
            .addRecord("actor", actorId)
            .addParameter("isAdmin", isAdmin)
            .addParameter("scope", scope)
            .execute()

        return { subject, locked: scope }
    }

    static async unlock(options: UnlockOptions): Promise<UnlockResult> {
        const { subjectType, subjectId, actorId, isAdmin } = options
        const subject = this.getSubject(subjectType, subjectId)
        await new DatabaseQuery()
            .addSql(`
                LET $target = (SELECT * FROM ONLY $subject);
                IF $target = NONE {
                    fn::http(404, "Moderation subject not found.");
                };
                IF !$isAdmin {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $actor;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $controlId = (SELECT VALUE id FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                LET $previousLock = (SELECT VALUE locked FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                IF $previousLock = NONE {
                    fn::http(409, "This content is not locked.");
                };
                LET $slowed = (SELECT VALUE slowed FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                IF $slowed = NONE {
                    DELETE $controlId;
                } ELSE {
                    UPDATE $controlId UNSET locked;
                };

                CREATE moderatorLog SET
                    actor = $actor,
                    action = "moderation.unlocked",
                    target = $subject,
                    details = { lock: { before: $previousLock, after: "unlocked" } };
            `)
            .addTransaction()
            .addRecord("subject", subject)
            .addRecord("actor", actorId)
            .addParameter("isAdmin", isAdmin)
            .execute()

        return { subject }
    }

    static async setSlowMode(options: SetSlowModeOptions): Promise<SlowModeResult> {
        const { subjectType, subjectId, actorId, isAdmin, interval } = options
        if (!["post", "gallery", "thread"].includes(subjectType)) {
            throw createError({ statusCode: 400, statusMessage: "Slow mode is only supported for discussions." })
        }
        if (typeof interval !== "number" || !Number.isSafeInteger(interval) || interval <= 0) {
            throw createError({ statusCode: 400, statusMessage: "A valid slow-mode interval is required." })
        }

        const subject = this.getSubject(subjectType, subjectId)
        await new DatabaseQuery()
            .addSql(`
                LET $target = (SELECT * FROM ONLY $subject);
                IF $target = NONE {
                    fn::http(404, "Moderation subject not found.");
                };
                IF record::tb($subject) = "thread" AND $target.replyTo != NONE {
                    fn::http(400, "Slow mode must be configured on a root thread.");
                };
                IF !$isAdmin {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic WHERE id IN $topics AND moderators CONTAINS $actor;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $settings = SELECT * FROM ONLY appSettings:default;
                IF !($settings.moderation.slowModes CONTAINS $interval) {
                    fn::http(400, "This slow-mode interval is not available.");
                };

                LET $controlId = (SELECT VALUE id FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                LET $previousInterval = (SELECT VALUE slowed FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                IF $previousInterval != NONE {
                    fn::http(409, "Slow mode is already active. Clear it before setting a new interval.");
                };

                IF $controlId = NONE {
                    CREATE moderation SET subject = $subject, slowed = $interval;
                } ELSE {
                    UPDATE $controlId SET slowed = $interval;
                };

                CREATE moderatorLog SET
                    actor = $actor,
                    action = "moderation.slow_mode.set",
                    target = $subject,
                    details = { slowMode: { before: $previousInterval ?? "disabled", after: $interval } };
            `)
            .addTransaction()
            .addRecord("subject", subject)
            .addRecord("actor", actorId)
            .addParameter("isAdmin", isAdmin)
            .addParameter("interval", interval)
            .execute()

        return { subject, slowed: interval }
    }

    static async clearSlowMode(options: ClearSlowModeOptions): Promise<ClearSlowModeResult> {
        const { subjectType, subjectId, actorId, isAdmin } = options
        if (!["post", "gallery", "thread"].includes(subjectType)) {
            throw createError({ statusCode: 400, statusMessage: "Slow mode is only supported for discussions." })
        }

        const subject = this.getSubject(subjectType, subjectId)
        await new DatabaseQuery()
            .addSql(`
                LET $target = (SELECT * FROM ONLY $subject);
                IF $target = NONE {
                    fn::http(404, "Moderation subject not found.");
                };
                IF record::tb($subject) = "thread" AND $target.replyTo != NONE {
                    fn::http(400, "Slow mode must be configured on a root thread.");
                };
                IF !$isAdmin {
                    LET $topics = array::union($target.topics ?? [], $target.context.topics ?? []);
                    LET $authorizedTopics = SELECT VALUE id FROM topic
                        WHERE id IN $topics AND moderators CONTAINS $actor;
                    IF $authorizedTopics.len() = 0 {
                        fn::http(403, "You cannot moderate this content.");
                    };
                };

                LET $controlId = (SELECT VALUE id FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                LET $previousInterval = (SELECT VALUE slowed FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                IF $previousInterval = NONE {
                    fn::http(409, "Slow mode is not active for this discussion.");
                };
                LET $previousLock = (SELECT VALUE locked FROM ONLY moderation WHERE subject = $subject LIMIT 1);
                IF $previousLock = NONE {
                    DELETE $controlId;
                } ELSE {
                    UPDATE $controlId UNSET slowed;
                };

                CREATE moderatorLog SET
                    actor = $actor,
                    action = "moderation.slow_mode.cleared",
                    target = $subject,
                    details = { slowMode: { before: $previousInterval, after: "disabled" } };
            `)
            .addTransaction()
            .addRecord("subject", subject)
            .addRecord("actor", actorId)
            .addParameter("isAdmin", isAdmin)
            .execute()

        return { subject }
    }
}