import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const id = event.context.params!.id!
    const body = await readBody<{ resolution?: string }>(event)
    return await ReportManager.resolve({ id, user: auth.id, resolution: body.resolution })
})