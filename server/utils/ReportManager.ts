import type { Report } from "@@/shared/types"
import { NotificationManager } from "@@/server/utils/repos/NotificationManager"

interface ReportModerationOptions {
    id: string
    user: string
    topic?: string
}

interface ReportResolutionOptions extends ReportModerationOptions {
    resolution?: string
}

interface ReportRemovalOptions extends ReportModerationOptions {
    resolution: unknown
}

interface ReportRemovalResult {
    report: Report
    subjectAuthor: string
    complaints: Array<{ reporter: string }>
    wasRemoved: boolean
}

interface ReportRestoreResult {
    report: Report
    subjectAuthor: string
    wasRemoved: boolean
}

interface ReportAppealResult {
    report: Report
    subjectAuthor: string
}

interface ReportAppealSubmissionOptions {
    id: string
    user: string
    reason: unknown
}

interface ReportAppealReviewOptions extends ReportModerationOptions {
    resolution: unknown
}

interface OwnerAppealStatus {
    id: string
    subject: { id: string }
    status: Report["status"]
    resolution?: string
    appeal?: Report["appeal"]
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

    static async create(subject: string, reporter: string, reason: unknown): Promise<void> {
        const normalizedReason = typeof reason === "string" ? reason.trim() : ""
        if (!normalizedReason) {
            throw createError({ status: 400, statusText: "A report reason is required." })
        }

        try {
            await new DatabaseQuery()
                .addSql(`
                    UPSERT report SET
                        subject = $subject,
                        complaints += { reporter: $reporter, reason: $reason, time: time::now() },
                        time = time::now()
                    WHERE subject = $subject
                    RETURN AFTER;
                `)
                .addRecord("subject", subject)
                .addRecord("reporter", reporter)
                .addParameter("reason", normalizedReason)
                .execute()
        }
        catch (error: any) {
            console.error(error)
            throw createError({ status: 500, statusText: error.message ?? error.toString() })
        }
    }

    static async resolve(options: ReportResolutionOptions): Promise<Report[]> {
        const { id, user, topic, resolution } = options
        const result = await new DatabaseQuery()
            .addSql(`
                IF $resolution != NONE AND string::len($resolution) < 3 {
                    fn::http(400, "Must provide a report resolution note.");
                };
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.status = "appealed" {
                    fn::http(409, "Pending appeals must be handled through appeal review.");
                };

                LET $wasRemoved = $report.status = "removed";
                IF $wasRemoved {
                    UPDATE $report.subject SET status = "active";
                };

                UPDATE $report SET
                    status = "approved",
                    resolution = $resolution,
                    moderator = $user;

                LET $updated = (SELECT * FROM $report)[0];
                RETURN {
                    report: $updated,
                    subjectAuthor: $report.subject.user,
                    wasRemoved: $wasRemoved
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .addRecord("topic", topic ?? "", true)
            .addParameter("resolution", resolution)
            .queryValue<ReportRestoreResult>()

        if (result.wasRemoved) {
            await NotificationManager.send({
                recipient: result.subjectAuthor,
                context: result.report.subject,
                message: "Your content was restored after the moderation decision changed.",
            })
        }

        return [result.report]
    }

    static async reopen(options: ReportModerationOptions): Promise<Report[]> {
        const { id, user, topic } = options
        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.status = "appealed" {
                    fn::http(409, "Pending appeals cannot be reopened.");
                };

                LET $wasRemoved = $report.status = "removed";
                IF $wasRemoved {
                    UPDATE $report.subject SET status = "active";
                };

                UPDATE $report SET
                    status = "pending",
                    resolution = NONE,
                    moderator = $user;

                LET $updated = (SELECT * FROM $report)[0];
                RETURN {
                    report: $updated,
                    subjectAuthor: $report.subject.user,
                    wasRemoved: $wasRemoved
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .addRecord("topic", topic ?? "", true)
            .queryValue<ReportRestoreResult>()

        if (result.wasRemoved) {
            await NotificationManager.send({
                recipient: result.subjectAuthor,
                context: result.report.subject,
                message: "Your content was restored after the report was reopened.",
            })
        }

        return [result.report]
    }

    static async remove(options: ReportRemovalOptions): Promise<Report[]> {
        const { id, user, topic, resolution } = options
        const normalizedResolution = typeof resolution === "string" ? resolution.trim() : ""
        if (normalizedResolution.length < 3) {
            throw createError({ status: 400, statusText: "A removal resolution note of at least 3 characters is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };

                LET $wasRemoved = $report.status != "removed";
                IF $wasRemoved {
                    IF NOT ($report.subject.status IN ["active", "archived"]) {
                        fn::http(409, "This content cannot be quarantined from its current status.");
                    };
                    UPDATE $report.subject SET status = "quarantined";
                };

                UPDATE $report SET
                    status = "removed",
                    resolution = $resolution,
                    moderator = $user;

                LET $updated = (SELECT * FROM $report)[0];
                RETURN {
                    report: $updated,
                    subjectAuthor: $report.subject.user,
                    complaints: $report.complaints,
                    wasRemoved: $wasRemoved
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .addRecord("topic", topic ?? "", true)
            .addParameter("resolution", normalizedResolution)
            .queryValue<ReportRemovalResult>()

        if (result.wasRemoved) {
            const recipients = new Set([result.subjectAuthor, ...result.complaints.map(complaint => complaint.reporter)])
            await Promise.all([...recipients].map(recipient => NotificationManager.send({
                recipient,
                context: recipient === result.subjectAuthor ? result.report.id : result.report.subject,
                message: recipient === result.subjectAuthor
                    ? "Your content was quarantined after a moderation review."
                    : "Moderators removed content you reported.",
            })))
        }

        return [result.report]
    }

    static async getOwnerAppeal(id: string, user: string): Promise<OwnerAppealStatus | null> {
        const reports = await new DatabaseQuery()
            .addSql(`
                SELECT id, subject.id, status, moderator.name, resolution, appeal
                FROM report
                WHERE id = $report
                AND subject.user = $user
                LIMIT 1
                FETCH subject, appeal.moderator
            `)
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .queryAll<OwnerAppealStatus>()

        return reports[0] ?? null
    }

    static async submitAppeal(options: ReportAppealSubmissionOptions): Promise<Report[]> {
        const { id, user, reason } = options
        const normalizedReason = typeof reason === "string" ? reason.trim() : ""
        if (normalizedReason.length < 3) {
            throw createError({ status: 400, statusText: "An appeal reason of at least 3 characters is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject != $user AND $report.subject.user != $user {
                    fn::http(403, "Only the owner of the moderated content can appeal.");
                };
                IF $report.status != "removed" OR $report.subject.status != "quarantined" {
                    fn::http(409, "Only removed content can be appealed.");
                };
                IF $report.moderator = NONE {
                    fn::http(409, "The original moderation decision is unavailable.");
                };
                IF $report.appeal != NONE {
                    fn::http(409, "This report already has an appeal.");
                };

                UPDATE $report SET
                    status = "appealed",
                    appeal = {
                        reason: $reason,
                        time: time::now()
                    };
                CREATE moderatorLog SET
                    actor = $user,
                    action = "report.appeal.submitted",
                    target = $report,
                    details = { reason: $reason };

                RETURN {
                    report: (SELECT * FROM $report)[0],
                    subjectAuthor: $report.subject.user
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .addParameter("reason", normalizedReason)
            .queryValue<ReportAppealResult>()

        return [result.report]
    }

    static async acceptAppeal(options: ReportAppealReviewOptions): Promise<Report[]> {
        const { id, user, topic, resolution } = options
        const normalizedResolution = typeof resolution === "string" ? resolution.trim() : ""
        if (normalizedResolution.length < 3) {
            throw createError({ status: 400, statusText: "An appeal resolution note of at least 3 characters is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.appeal = NONE OR $report.appeal.moderator != NONE {
                    fn::http(409, "This report has no pending appeal.");
                };
                IF $report.status != "appealed" OR $report.subject.status != "quarantined" {
                    fn::http(409, "The appealed content is no longer removed.");
                };
                IF $report.moderator = $user {
                    fn::http(403, "A different moderator must review the appeal.");
                };

                LET $appeal = $report.appeal;
                UPDATE $report.subject SET status = "active";
                UPDATE $report SET
                    status = "approved",
                    resolution = $resolution,
                    moderator = $user,
                    appeal = {
                        reason: $appeal.reason,
                        time: $appeal.time,
                        moderator: $user
                    };
                CREATE moderatorLog SET
                    actor = $user,
                    action = "report.appeal.accepted",
                    target = $report,
                    details = { reason: $appeal.reason, resolution: $resolution };

                RETURN {
                    report: (SELECT * FROM $report)[0],
                    subjectAuthor: $report.subject.user
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .addRecord("topic", topic ?? "", true)
            .addParameter("resolution", normalizedResolution)
            .queryValue<ReportAppealResult>()

        await NotificationManager.send({
            recipient: result.subjectAuthor,
            context: result.report.id,
            message: "Your moderation appeal was accepted and your content was restored.",
        })

        return [result.report]
    }

    static async rejectAppeal(options: ReportAppealReviewOptions): Promise<Report[]> {
        const { id, user, topic, resolution } = options
        const normalizedResolution = typeof resolution === "string" ? resolution.trim() : ""
        if (normalizedResolution.length < 3) {
            throw createError({ status: 400, statusText: "An appeal resolution note of at least 3 characters is required." })
        }

        const result = await new DatabaseQuery()
            .addSql(`
                IF $report.subject = $user OR $report.subject.user = $user {
                    fn::http(403, "You cannot moderate reports about your own content.");
                };
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };
                IF $report.appeal = NONE OR $report.appeal.moderator != NONE {
                    fn::http(409, "This report has no pending appeal.");
                };
                IF $report.status != "appealed" OR $report.subject.status != "quarantined" {
                    fn::http(409, "The appealed content is no longer removed.");
                };
                IF $report.moderator = $user {
                    fn::http(403, "A different moderator must review the appeal.");
                };

                LET $appeal = $report.appeal;
                UPDATE $report SET
                    status = "removed",
                    moderator = $user,
                    resolution = $resolution,
                    appeal = {
                        reason: $appeal.reason,
                        time: $appeal.time,
                        moderator: $user
                    };
                CREATE moderatorLog SET
                    actor = $user,
                    action = "report.appeal.rejected",
                    target = $report,
                    details = { reason: $appeal.reason, resolution: $resolution };

                RETURN {
                    report: (SELECT * FROM $report)[0],
                    subjectAuthor: $report.subject.user
                };
            `)
            .addTransaction()
            .addRecord("report", `report:${id}`)
            .addRecord("user", user)
            .addRecord("topic", topic ?? "", true)
            .addParameter("resolution", normalizedResolution)
            .queryValue<ReportAppealResult>()

        await NotificationManager.send({
            recipient: result.subjectAuthor,
            context: result.report.id,
            message: "Your moderation appeal was rejected and the content remains removed.",
        })

        return [result.report]
    }
}