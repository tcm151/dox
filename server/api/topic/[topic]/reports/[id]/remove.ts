import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id, topic } = event.context.params!
    const topicScope = hasRole(auth, "admin") ? undefined : topic
    if (!id) throw createError({ status: 400, statusMessage: "Report ID is required." })

    const body = await readBody<{ resolution?: unknown }>(event) ?? {}
    return await ReportManager.remove({ id, user: auth.id, topic: topicScope, resolution: body.resolution })
})