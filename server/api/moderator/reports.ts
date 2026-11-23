import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    return await new DatabaseQuery()
        .addSql(`
            LET $topics = (
                SELECT VALUE id
                FROM topic
                WHERE moderators CONTAINS $user
            );
            RETURN SELECT id, topics, time, status, owner,
                moderator.{id, name, roles},
                subject.{id, content, context},
                complaints.{user.{id, name, roles}, reason, time},
                history.{action, message, user.{id, name, roles}, time, changes}
            FROM report
            WHERE record::exists(subject)
            AND (subject != $user AND subject.user != $user)
            AND (
                (topics CONTAINSANY $topics AND (status != "appealed" OR moderator != $user))
                OR $user.roles CONTAINS "admin"
            )
            ORDER BY time DESC
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .queryValue<Report[]>()
})