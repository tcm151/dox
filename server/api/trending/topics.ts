export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT count(), topic
            FROM (
                SELECT id, topics AS topic
                FROM post
                WHERE time > (time::now() - 26w)
                SPLIT topic
            )
            GROUP BY topic
            ORDER BY count DESC
            LIMIT 5
        `)
        .queryAll<{ count: number, topic: string }>()
})