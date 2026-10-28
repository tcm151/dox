import { ReportManager } from "@@/server/utils/ReportManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const report = await readBody<{ subject: string, reason: string }>(event)

    return await ReportManager.create(report.subject, auth.id, report.reason)
})