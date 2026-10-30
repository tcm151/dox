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

            SELECT id, subject.id, subject.content, subject.context.id, owner, topics, time, status, complaints, moderator, history
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
            FETCH subject, subject.user, complaints.user, moderator, history.user
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .queryAll<Report>()
})