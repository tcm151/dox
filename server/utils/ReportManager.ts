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
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
                };

                LET $wasRemoved = $report.status = "removed";
                IF $wasRemoved {
                    UPDATE $report.subject SET status = "active";
                };

                UPDATE $report SET
                    status = "resolved",
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
                IF $topic IS NOT NULL {
                    IF NOT ($topic.moderators CONTAINS $user) {
                        fn::http(403, "You cannot moderate this topic.");
                    };
                    IF NOT ($report.subject.topics CONTAINS $topic) {
                        fn::http(404, "This report is not part of this topic.");
                    };
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

    static async remove(options: ReportModerationOptions): Promise<Report[]> {
        const { id, user, topic } = options
        const result = await new DatabaseQuery()
            .addSql(`
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
                    resolution = NONE,
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
            .queryValue<ReportRemovalResult>()

        if (result.wasRemoved) {
            const recipients = new Set([result.subjectAuthor, ...result.complaints.map(complaint => complaint.reporter)])
            await Promise.all([...recipients].map(recipient => NotificationManager.send({
                recipient,
                context: result.report.subject,
                message: recipient === result.subjectAuthor
                    ? "Your content was quarantined after a moderation review."
                    : "Moderators removed content you reported.",
            })))
        }

        return [result.report]
    }
}