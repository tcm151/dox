import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const id = event.context.params!.id!
    const body = await readBody<{ resolution?: unknown }>(event)

    return await ReportManager.rejectAppeal({ id, user: auth.id, resolution: body.resolution })
})