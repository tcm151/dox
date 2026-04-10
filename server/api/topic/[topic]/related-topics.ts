export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, count()
            FROM (
                SELECT topics AS id
                FROM post, thread
                WHERE topics CONTAINS $topic
                SPLIT topics
            )
            WHERE id != $topic
            GROUP BY id
            ORDER BY count DESC
            LIMIT 5
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<{ id: string, count: number }>()
})