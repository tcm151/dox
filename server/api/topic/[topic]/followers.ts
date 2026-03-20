export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT count(topics CONTAINS $topic)
            FROM user
            GROUP ALL
        `)
        .addRecordId("topic", `topic:${topic}`)
        .queryOne<{ count: number }>()
})