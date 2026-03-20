export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            topics = array::union(topics, [$topic])
        `)
        .addRecordId("user", auth.id)
        .addRecordId("topic", `topic:${topic}`)
        .queryOne()
})