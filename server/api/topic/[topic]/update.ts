import type { Topic } from "@@/shared/types"

interface UpdateTopicRequest {
    description: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")
    
    const { topic } = event.context.params!
    const body = await readBody<UpdateTopicRequest>(event)

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $topic SET
                description = $description
        `)
        .addRecord("topic", `topic:${topic}`)
        .addParameter("description", body.description)
        .queryOne<Topic>()
})