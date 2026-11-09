import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { type, id } = event.context.params!
    if (!type || !id) throw createError({ statusCode: 400, statusMessage: "A moderation target is required." })

    return await ModerationManager.clearSlowMode(`${type}:${id}`, auth.id)
})