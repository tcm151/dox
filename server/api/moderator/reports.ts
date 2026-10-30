import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    return await new DatabaseQuery()
        .addSql(`
            LET $topics = (
                SELECT id
                FROM topic
                WHERE moderators CONTAINS $user
                ORDER BY score DESC
            );
            LET $topicIds = $topics.id;
            LET $reports = (
                SELECT id, subject.id, subject.content, subject.context.id, topics,
                    time, status, complaints, moderator, history, owner
                FROM report
                WHERE record::exists(subject)
                    AND topics CONTAINSANY $topicIds
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
            );

            RETURN $reports;
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .queryValue<Report[]>()
})