import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { topic } = event.context.params!
    if (!topic) throw createError({ statusCode: 400, statusMessage: "A topic is required." })

    return await ModerationManager.unlockTopic(`topic:${topic}`, auth.id)
})
