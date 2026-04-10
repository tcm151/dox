export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    await new DatabaseQuery()
        .addSql(`
            UPDATE notification SET
                viewed = true
            WHERE recipient = $user
        `)
        .addRecord("user", auth.id)
        .execute()

    return true
})