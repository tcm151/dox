import type { Topic } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"

interface UpdateTopicRequest {
    description: string
    moderation: Topic["moderation"]
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])
    
    const { topic } = event.context.params!
    const body = await readBody<UpdateTopicRequest>(event)

    const validator = new Validator("TopicSettings")
    validator.object(body, "settings", (v, settings) => {
        v.string(settings.description, "description")
        v.object(settings.moderation, "moderation", (v, moderation) => {
            v.integer(moderation.maxPostInterval, "maxPostInterval", { min: 0, max: 3600 })
            v.integer(moderation.priorityReportThreshold, "priorityReportThreshold", { min: 1, max: 100 })
        })
    })
    validator.confirm()

    return await new DatabaseQuery()
        .addSql(`
            IF $topic.moderators CONTAINS $user OR $user.roles CONTAINS "admin" {
                UPDATE $topic SET
                    description = $description,
                    moderation = $moderation;
            };
        `)
        .addRecord("user", auth.id)
        .addRecord("topic", `topic:${topic}`)
        .addParameter("description", body.description)
        .addParameter("moderation", body.moderation)
        .queryOne<Topic>()
})