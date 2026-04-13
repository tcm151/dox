import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, reporter.id, reporter.name, subject.id, time
            FROM report
            WHERE subject.topics CONTAINS $topic
            ORDER BY time DESC
            FETCH reporter, subject
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Report>()
})