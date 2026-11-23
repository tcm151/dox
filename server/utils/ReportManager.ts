import type { Report } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

interface ReportMessageOptions {
    reportId: string
    actorId: string
    topicId?: string
    message: unknown
}

interface ReportTopicMessageOptions extends ReportMessageOptions {
    topicId: string
}

interface ReportResult {
    report: Report
    subjectOwnerId: string
}

interface ReportRestoreResult extends ReportResult {
    subjectWasQuarantined: boolean
}

interface ReportRemovalResult extends ReportResult {
    complaints: Array<{ user: string }>
    newlyQuarantined: boolean
}

interface OwnerAppealStatus {
    id: string
    subject: { id: string }
    status: Report["status"]
    moderator?: Report["moderator"]
    history: Report["history"]
}

export class ReportManager {
    static async clean(): Promise<void> {
        await new DatabaseQuery()
            .addSql(`
                DELETE report
                WHERE !record::exists(subject);
            `)
            .execute()
    }

    static async create(subjectId: string, reporterId: string, reason: unknown): Promise<void> {
        const normalizedReason = typeof reason === "string" ? reason.trim() : ""
        if (!normalizedReason) {
            throw createError({ status: 400, statusText: "A report reason is required." })
        }

        await new DatabaseQuery()
            .addSql(`
                LET $existing = (
                    SELECT VALUE id
                    FROM ONLY report
                    WHERE subject = $subject
                    LIMIT 1
                );
                IF $existing = NONE {
                    CREATE report SET
                        subject = $subject,
                        complaints = [{ user: $reporter, reason: $reason, time: time::now() }];
                } ELSE {
                    UPDATE $existing SET
                        complaints += { user: $reporter, reason: $reason, time: time::now() };
                };
            `)
            .addTransaction()
            .addRecord("subject", subjectId)
            .addRecord("reporter", reporterId)
            .addParameter("reason", normalizedReason)
            .execute()
    }

    static async resolve(options: ReportMessageOptions): Promise<Report[]> {
        const { reportId, actorId, topicId, message } = options
        const normalizedMessage = typeof message === "string" ? message.trim() : ""
        if (!normalizedMessage) {
            throw createError({ status: 400, statusText: "A report decision message is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic != NONE {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.status = "appealed" {
                    fn::http(409, "Pending appeals must be handled through appeal review.");
                };

                LET $beforeStatus = $report.status;
                LET $subjectWasQuarantined = $report.subject.status = "quarantined";
                IF $subjectWasQuarantined {
                    UPDATE $report.subject SET status = "active";
                };

                UPDATE $report SET
                    status = "closed",
                    moderator = $user,
                    history += {
                        action: "report.approved",
                        message: $message,
                        user: $user,
                        time: time::now(),
                        changes: { status: { before: $beforeStatus, after: "closed" } }
                    };

                LET $updated = (SELECT * FROM ONLY $report);
                RETURN {
                    report: $updated,
                    subjectOwnerId: $report.subject.user,
                    subjectWasQuarantined: $subjectWasQuarantined
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("user", actorId)
            .addRecord("topic", topicId)
            .addParameter("message", normalizedMessage)
            .queryValue<ReportRestoreResult>()

        if (result.subjectWasQuarantined) {
            await NotificationManager.send({
                recipient: result.subjectOwnerId,
                context: result.report.subject,
                message: "Your content was restored after the moderation decision changed.",
            })
        }

        return [result.report]
    }

    static async reopen(options: ReportMessageOptions): Promise<Report[]> {
        const { reportId, actorId, topicId, message } = options
        const normalizedMessage = typeof message === "string" ? message.trim() : ""
        if (!normalizedMessage) {
            throw createError({ status: 400, statusText: "A report reopen message is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic != NONE {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.status = "appealed" {
                    fn::http(409, "Pending appeals cannot be reopened.");
                };

                LET $beforeStatus = $report.status;
                LET $subjectWasQuarantined = $report.subject.status = "quarantined";
                IF $subjectWasQuarantined {
                    UPDATE $report.subject SET status = "active";
                };

                UPDATE $report SET
                    status = "pending",
                    moderator = NONE,
                    history += {
                        action: "report.reopened",
                        message: $message,
                        user: $user,
                        time: time::now(),
                        changes: { status: { before: $beforeStatus, after: "pending" } }
                    };

                LET $updated = (SELECT * FROM ONLY $report);
                RETURN {
                    report: $updated,
                    subjectOwnerId: $report.subject.user,
                    subjectWasQuarantined: $subjectWasQuarantined
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("user", actorId)
            .addRecord("topic", topicId)
            .addParameter("message", normalizedMessage)
            .queryValue<ReportRestoreResult>()

        if (result.subjectWasQuarantined) {
            await NotificationManager.send({
                recipient: result.subjectOwnerId,
                context: result.report.subject,
                message: "Your content was restored after the report was reopened.",
            })
        }

        return [result.report]
    }

    static async remove(options: ReportMessageOptions): Promise<Report[]> {
        const { reportId, actorId, topicId, message } = options
        const normalizedMessage = typeof message === "string" ? message.trim() : ""
        if (!normalizedMessage) {
            throw createError({ status: 400, statusText: "A report removal message is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic != NONE {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };

                IF $report.status = "appealed" {
                    fn::http(409, "Pending appeals must be handled through appeal review.");
                };

                LET $beforeStatus = $report.status;
                LET $newlyQuarantined = $report.subject.status != "quarantined";
                IF $newlyQuarantined {
                    IF NOT ($report.subject.status IN ["active", "archived"]) {
                        fn::http(409, "This content cannot be quarantined from its current status.");
                    };
                    UPDATE $report.subject SET status = "quarantined";
                };

                UPDATE $report SET
                    status = "removed",
                    moderator = $user,
                    history += {
                        action: "report.removed",
                        message: $message,
                        user: $user,
                        time: time::now(),
                        changes: { status: { before: $beforeStatus, after: "removed" } }
                    };

                LET $updated = (SELECT * FROM ONLY $report);
                RETURN {
                    report: $updated,
                    subjectOwnerId: $report.subject.user,
                    complaints: $report.complaints,
                    newlyQuarantined: $newlyQuarantined
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("user", actorId)
            .addRecord("topic", topicId)
            .addParameter("message", normalizedMessage)
            .queryValue<ReportRemovalResult>()

        if (result.newlyQuarantined) {
            const recipients = new Set([result.subjectOwnerId, ...result.complaints.map(complaint => complaint.user)])
            await Promise.all([...recipients].map(recipient => NotificationManager.send({
                recipient,
                context: recipient === result.subjectOwnerId ? result.report.id : result.report.subject,
                message: recipient === result.subjectOwnerId
                    ? "Your content was quarantined after a moderation review."
                    : "Moderators removed content you reported.",
            })))
        }

        return [result.report]
    }

    static async removeTopic(options: ReportTopicMessageOptions): Promise<Report[]> {
        const { reportId, actorId, topicId, message } = options
        const normalizedMessage = typeof message === "string" ? message.trim() : ""
        if (!normalizedMessage) {
            throw createError({ status: 400, statusMessage: "A topic removal message is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF NOT ($topic.moderators CONTAINS $user) {
                    fn::http(403, "You cannot moderate this topic.");
                };
                IF NOT ($report.topics CONTAINS $topic) {
                    fn::http(404, "This report is not part of this topic.");
                };
                IF $report.subject.context != NONE {
                    fn::http(409, "Comment report topics are inherited from the containing submission.");
                };
                IF $report.status != "pending" {
                    fn::http(409, "Only pending reports can remove a topic from a submission.");
                };

                LET $subject = $report.subject;
                UPDATE $subject SET
                    topics -= $topic;

                IF $topic.posts.len() = 0 AND $topic.threads.len() = 0 AND $topic.galleries.len() = 0 {
                    DELETE $topic;
                };

                UPDATE $report SET
                    history += {
                        action: "report.topic.removed",
                        message: $message,
                        user: $user,
                        time: time::now(),
                        changes: { topic: $topic }
                    };

                RETURN { report: (SELECT * FROM ONLY $report) };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("user", actorId)
            .addRecord("topic", `topic:${topicId}`)
            .addParameter("message", normalizedMessage)
            .queryValue<{ report: Report }>()

        return [result.report]
    }

    static async getOwnerAppeal(reportId: string, ownerId: string): Promise<OwnerAppealStatus | null> {
        const result = await new DatabaseQuery()
            .addSql(`
                LET $appeal = (
                    SELECT id, subject.{id}, status,
                        moderator.{id, name, roles},
                        history.{action, message, user.{id, name, roles}, time, changes}
                    FROM ONLY report
                    WHERE id = $report
                    AND subject.user = $owner
                    LIMIT 1
                );
                RETURN { appeal: $appeal ?? null };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("owner", ownerId)
            .queryValue<{ appeal?: OwnerAppealStatus | null }>()

        return result.appeal ?? null
    }

    static async submitAppeal(options: { reportId: string, ownerId: string, reason: unknown }): Promise<Report[]> {
        const { reportId, ownerId, reason } = options
        const normalizedReason = typeof reason === "string" ? reason.trim() : ""
        if (!normalizedReason) {
            throw createError({ status: 400, statusText: "An appeal reason is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject != $owner AND $report.subject.user != $owner {
                    fn::http(403, "Only the owner of the moderated content can appeal.");
                };
                IF $report.status != "removed" OR $report.subject.status != "quarantined" {
                    fn::http(409, "Only removed content can be appealed.");
                };
                IF $report.moderator = NONE {
                    fn::http(409, "The original moderation decision is unavailable.");
                };
                IF array::any($report.history, |$entry| $entry.action = "report.appeal.submitted") {
                    fn::http(409, "This report already has an appeal.");
                };

                UPDATE $report SET
                    status = "appealed",
                    history += {
                        action: "report.appeal.submitted",
                        message: $reason,
                        user: $owner,
                        time: time::now(),
                        changes: { status: { before: "removed", after: "appealed" } }
                    };

                RETURN {
                    report: (SELECT * FROM ONLY $report),
                    subjectOwnerId: $report.subject.user
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("owner", ownerId)
            .addParameter("reason", normalizedReason)
            .queryValue<ReportResult>()

        return [result.report]
    }

    static async acceptAppeal(options: ReportMessageOptions): Promise<Report[]> {
        const { reportId, actorId, topicId, message } = options
        const normalizedMessage = typeof message === "string" ? message.trim() : ""
        if (!normalizedMessage) {
            throw createError({ status: 400, statusText: "An appeal decision message is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic != NONE {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.status != "appealed" OR $report.subject.status != "quarantined" {
                    fn::http(409, "The appealed content is no longer removed.");
                };
                IF $report.moderator = $user {
                    fn::http(403, "A different moderator must review the appeal.");
                };

                UPDATE $report.subject SET status = "active";
                UPDATE $report SET
                    status = "closed",
                    moderator = $user,
                    history += {
                        action: "report.appeal.accepted",
                        message: $message,
                        user: $user,
                        time: time::now(),
                        changes: {
                            status: { before: "appealed", after: "closed" },
                            subjectStatus: { before: "quarantined", after: "active" }
                        }
                    };

                RETURN {
                    report: (SELECT * FROM ONLY $report),
                    subjectOwnerId: $report.subject.user
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("user", actorId)
            .addRecord("topic", topicId)
            .addParameter("message", normalizedMessage)
            .queryValue<ReportResult>()

        await NotificationManager.send({
            recipient: result.subjectOwnerId,
            context: result.report.id,
            message: "Your moderation appeal was accepted and your content was restored.",
        })

        return [result.report]
    }

    static async rejectAppeal(options: ReportMessageOptions): Promise<Report[]> {
        const { reportId, actorId, topicId, message } = options
        const normalizedMessage = typeof message === "string" ? message.trim() : ""
        if (!normalizedMessage) {
            throw createError({ status: 400, statusText: "An appeal decision message is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic != NONE {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.status != "appealed" OR $report.subject.status != "quarantined" {
                    fn::http(409, "The appealed content is no longer removed.");
                };
                IF $report.moderator = $user {
                    fn::http(403, "A different moderator must review the appeal.");
                };

                UPDATE $report SET
                    status = "denied",
                    moderator = $user,
                    history += {
                        action: "report.appeal.rejected",
                        message: $message,
                        user: $user,
                        time: time::now(),
                        changes: { status: { before: "appealed", after: "denied" } }
                    };

                RETURN {
                    report: (SELECT * FROM ONLY $report),
                    subjectOwnerId: $report.subject.user
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${reportId}`)
            .addRecord("user", actorId)
            .addRecord("topic", topicId)
            .addParameter("message", normalizedMessage)
            .queryValue<ReportResult>()

        await NotificationManager.send({
            recipient: result.subjectOwnerId,
            context: result.report.subject,
            message: "Your moderation appeal was rejected and the content remains removed.",
        })

        return [result.report]
    }
}