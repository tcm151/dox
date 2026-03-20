import type { Topic } from "~/types"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $topic
            FETCH posts, posts.images
        `)
        .addRecordId("topic", `topic:${topic}`)
        .queryOne<Topic>()
})