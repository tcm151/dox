export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT topics AS id, count()
            FROM (
                SELECT topics
                FROM post, thread
                WHERE topics CONTAINS topic:Testing
                SPLIT topics
            )
            GROUP BY topics
            ORDER BY count DESC
            LIMIT 5
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<{ id: string, count: number }>()
})