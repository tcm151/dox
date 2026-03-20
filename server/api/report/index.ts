export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "moderator", "developer"])

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, reporter.id, subject.id, time
            FROM report
            WHERE reporter.id AND subject.id
            ORDER BY time DESC
            FETCH reporter, subject
        `)
        .queryAll<{ subject: string, reporter: string, time?: string }>()
})