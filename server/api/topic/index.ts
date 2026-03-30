import type { Topic } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM topic
            ORDER BY score DESC
        `)
        .queryAll<Topic>()
})