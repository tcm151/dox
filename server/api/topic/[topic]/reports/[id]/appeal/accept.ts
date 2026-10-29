import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id, topic } = event.context.params!
    if (!id) throw createError({ status: 400, statusMessage: "Report ID is required." })
    const body = await readBody<{ message?: unknown }>(event)
    const topicScope = hasRole(auth, "admin") ? undefined : topic

    return await ReportManager.acceptAppeal({ reportId: id, actorId: auth.id, topicId: topicScope, message: body.message })
})