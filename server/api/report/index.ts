import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, subject.id, time, status, resolution, complaints, moderator, appeal, author
            FROM report
            WHERE record::exists(subject)
            ORDER BY time DESC
            FETCH subject, subject.user, complaints.reporter, moderator, appeal.moderator
        `)
        .queryAll<Report>()
})