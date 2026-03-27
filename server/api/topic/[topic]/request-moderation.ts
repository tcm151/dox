export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            CREATE moderationRequest SET
                topic = $topic,
                user = $user;
        `)
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .queryOne()
})