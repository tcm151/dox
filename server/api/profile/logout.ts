export default defineEventHandler(async (event) => {
    await authenticateRequest(event)
    return await invalidateSession(event)
})