import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const body = await readBody<{ reason: string }>(event)
    const { id } = event.context.params!

    return await ReportManager.create(`image:${id}`, auth.id, body.reason)
})