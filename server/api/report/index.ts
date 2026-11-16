import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, subject.{id, content, context.{id}}, owner, topics, time, status,
                complaints.{user.{id, name, roles}, reason, time},
                moderator.{id, name, roles},
                history.{action, message, user.{id, name, roles}, time, changes}
            FROM report
            WHERE record::exists(subject)
            ORDER BY time DESC
        `)
        .queryAll<Report>()
})