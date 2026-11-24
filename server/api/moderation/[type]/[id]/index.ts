import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { type, id } = event.context.params!
    // TODO need to use status/statusText in all createError usages
    if (!type || !id) throw createError({ statusCode: 400, statusMessage: "A moderation target is required." })

    return await ModerationManager.getModeration(`${type}:${id}`, auth.id)
})