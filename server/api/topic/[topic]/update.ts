import type { Topic } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"

interface UpdateTopicRequest {
    description: string
    moderation: Topic["moderation"]
    rules: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])
    
    const { topic } = event.context.params!
    const body = await readBody<UpdateTopicRequest>(event)

    new Validator("TopicSettings")
        .string(body.description, "description")
        .object(body.moderation, "moderation", (v, moderation) => {
            v.integer(moderation.maxPostInterval, "maxPostInterval", { min: 0, max: 3600 })
            v.integer(moderation.priorityReportThreshold, "priorityReportThreshold", { min: 1, max: 100 })
        })
        .string(body.rules, "rules")
        .confirm()

    return await new DatabaseQuery()
        .addSql(`
            IF !record::exists($topic) {
                fn::http(404, "Topic not found.");
            };
            IF NOT ($topic.moderators CONTAINS $user OR $user.roles CONTAINS "admin") {
                fn::http(403, "You cannot update this topic profile.");
            };
            UPDATE $topic SET
                description = $description,
                moderation = $moderation,
                rules = $rules;
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .addRecord("topic", `topic:${topic}`)
        .addParameter("description", body.description)
        .addParameter("moderation", body.moderation)
        .addParameter("rules", body.rules)
        .execute()
})