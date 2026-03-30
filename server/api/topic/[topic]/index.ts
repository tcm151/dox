import type { Topic } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $topic
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryOne<Topic>()
})