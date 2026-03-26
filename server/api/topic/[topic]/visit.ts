import type { Topic } from "~/types"

export default defineEventHandler(async (event) => {
    const id = event.context.params!.topic!.toString()

    const topic = await new DatabaseQuery()
        .addSql(`
            UPDATE $topic SET
            visits += 1    
        `)
        .addRecord("topic", `topic:${id}`)
        .queryOne<Topic>()

    return topic.visits
})