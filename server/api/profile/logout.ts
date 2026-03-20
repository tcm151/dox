export default defineEventHandler(async (event) => {
    try {
        let query = getQuery<{ clear: boolean }>(event)
        await invalidateSession(event, query.clear)
    }
    catch (ex: any) {
        // failed to authenticate session to invalidate
    }
})