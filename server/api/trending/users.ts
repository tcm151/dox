export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM (
                SELECT id, name, score
                FROM user
            )
            WHERE score > 0
            ORDER BY score DESC
            LIMIT 5
        `)
        .queryAll<{ id: string, name: string, score: number }>()
})