import type { Topic } from "~/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, score
            FROM topic
            ORDER BY score DESC
        `)
        .queryAll<Topic>()
})