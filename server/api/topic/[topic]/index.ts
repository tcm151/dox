import type { Topic } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $topic
            FETCH moderators, galleries, galleries.user, galleries.images
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryOne<Topic>()
})