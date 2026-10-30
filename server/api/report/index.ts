import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, subject.id, subject.content, subject.context.id, owner, topics, time, status, complaints, moderator, history
            FROM report
            WHERE record::exists(subject)
            ORDER BY time DESC
            FETCH subject, subject.user, complaints.user, moderator, history.user
        `)
        .queryAll<Report>()
})