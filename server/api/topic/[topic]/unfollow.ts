export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $user SET
            topics = array::difference(topics, [$topic])
        `)
        .addRecord("user", auth.id)
        .addRecord("topic", `topic:${topic}`)
        .queryOne()
})