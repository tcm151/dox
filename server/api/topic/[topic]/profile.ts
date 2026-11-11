import type { Topic } from "@@/shared/types"
import { hasRole, requireRole } from "@@/shared/utils/roles"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic } = event.context.params!
    const profile = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $topic
            FETCH moderators, galleries, galleries.user, galleries.images
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
