export default defineEventHandler(async (event) => {
    await authenticateRequest(event)

    const currentSessionId = getHeader(event, "Authorization") ?? ""
    await SessionManager.invalidateSessions(event.context.account, currentSessionId)

    return { success: true }
})