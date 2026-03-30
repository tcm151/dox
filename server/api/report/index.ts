import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, reporter.id, reporter.name, subject.id, time
            FROM report
            ORDER BY time DESC
            FETCH reporter, subject
        `)
        .queryAll<Report>()
})