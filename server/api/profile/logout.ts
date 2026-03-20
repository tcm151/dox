export default defineEventHandler(async (event) => {
    try {
        const { clear } = await readBody<{ clear: boolean }>(event)
        await invalidateSession(event, clear)
    }
    catch (ex: any) {
        // failed to authenticate session to invalidate
    }
})