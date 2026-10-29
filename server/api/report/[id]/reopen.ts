import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const id = event.context.params!.id!
    const body = await readBody<{ message?: unknown }>(event)
    return await ReportManager.reopen({ reportId: id, actorId: auth.id, message: body?.message })
})