import type { Topic } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, score
            FROM topic
            ORDER BY score DESC
        `)
        .queryAll<Topic>()
})