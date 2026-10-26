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

            SELECT id, subject.id, time, status, resolution, complaints
            FROM report
            WHERE record::exists(subject)
            AND subject.topics CONTAINS $topic
            ORDER BY time DESC
            FETCH subject, complaints.reporter
        `)
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .queryAll<Report>()
})