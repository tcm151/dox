export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const report = await readBody<{ subject: string, reason: string }>(event)

    return await createReport(report.subject, auth.id, report.reason)
})