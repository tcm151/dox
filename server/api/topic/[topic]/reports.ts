import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF NOT ($topic.moderators CONTAINS $user OR $user.roles CONTAINS "admin") {
                fn::http(403, "You cannot moderate this topic.");
            };

            SELECT id, subject.{id, content, context.{id}}, owner, topics, time, status,
                complaints.{user.{id, name, roles}, reason, time},
                moderator.{id, name, roles},
                history.{action, message, user.{id, name, roles}, time, changes},
                status IN ["pending", "appealed"] AND array::len(array::union(complaints.*.user, [])) >= $topic.moderation.priorityReportThreshold AS priority
            FROM report
            WHERE record::exists(subject)
            AND topics CONTAINS $topic
            AND (
                $user.roles CONTAINS "admin"
                OR (
                    subject != $user
                    AND subject.user != $user
                    AND (status != "appealed" OR moderator != $user)
                )
            )
            ORDER BY time DESC
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .queryAll<Report>()
})