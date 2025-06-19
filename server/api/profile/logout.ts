export default defineEventHandler(async (event) => {
    try {
        await authenticateRequest(event)
        return await invalidateSession(event)
    }
    catch (ex: any) {
        // failed to authenticate session to invalidate
    }
})