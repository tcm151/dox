import type { Topic } from "@@/shared/types"
import { hasRole, requireRole } from "@@/shared/utils/roles"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic } = event.context.params!
    const profile = await new DatabaseQuery()
        .addSql(`
            SELECT id, description, rules, moderation, moderators.{id, name, roles}
            FROM $topic
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryOne<Topic>()

    if (!hasRole(auth, "admin") && !profile.moderators.some(moderator => moderator.id === auth.id)) {
        throw createError({
            statusCode: 403,
            statusMessage: "You are not allowed to update this topic profile.",
        })
    }

    return profile
})
