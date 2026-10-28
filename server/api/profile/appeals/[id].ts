import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const id = event.context.params!.id!
    return await ReportManager.getOwnerAppeal(id, auth.id)
})