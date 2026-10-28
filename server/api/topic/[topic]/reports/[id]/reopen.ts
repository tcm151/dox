import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id, topic } = event.context.params!
    if (!id) throw createError({ status: 400, statusMessage: "Report ID is required." })
    const topicScope = hasRole(auth, "admin") ? undefined : topic
    return await ReportManager.reopen({ id, user: auth.id, topic: topicScope })
})