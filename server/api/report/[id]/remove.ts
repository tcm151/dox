import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const id = event.context.params!.id!
    return await ReportManager.remove({ id, user: auth.id })
})