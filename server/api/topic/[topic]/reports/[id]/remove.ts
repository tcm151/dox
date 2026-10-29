import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    if (!id) throw createError({ status: 400, statusMessage: "Report ID is required." })

    const body = await readBody<{ message?: unknown }>(event) ?? {}
    return await ReportManager.remove({ reportId: id, actorId: auth.id, message: body.message })
})