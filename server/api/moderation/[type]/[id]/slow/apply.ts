import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { type, id } = event.context.params!
    if (!type || !id) throw createError({ statusCode: 400, statusMessage: "A moderation target is required." })
    const body = await readBody<{ interval?: unknown }>(event)

    return await ModerationManager.setSlowMode(`${type}:${id}`, auth.id, body?.interval)
})