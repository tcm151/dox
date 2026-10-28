import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const id = event.context.params!.id!
    const body = await readBody<{ reason?: unknown }>(event)
    return await ReportManager.submitAppeal({ id, user: auth.id, reason: body.reason })
})