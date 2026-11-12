import { ModerationManager } from "@@/server/utils/ModerationManager"
import { parseRecordId } from "@@/shared/utils/records"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { topic } = event.context.params!
    const body = await readBody<{ user: string }>(event)

    if (typeof body?.user !== "string" || parseRecordId(body.user)?.table !== "user") {
        throw createError({ statusCode: 400, statusMessage: "A valid user is required." })
    }

    return await ModerationManager.removeModeratorFromTopic(`topic:${topic}`, body.user, auth.id)
})
