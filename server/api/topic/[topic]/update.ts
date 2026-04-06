import type { Topic } from "@@/shared/types"

interface UpdateTopicRequest {
    description: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])
    
    const { topic } = event.context.params!
    const body = await readBody<UpdateTopicRequest>(event)

    return await new DatabaseQuery()
        .addSql(`
            IF $topic.moderators CONTAINS $user OR $user.roles CONTAINS "admin" {
                UPDATE $topic SET
                    description = $description;
            };
        `)
        .addRecord("user", auth.id)
        .addRecord("topic", `topic:${topic}`)
        .addParameter("description", body.description)
        .queryOne<Topic>()
})