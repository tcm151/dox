export default defineEventHandler(async (event) => {
    const { clear } = await readBody<{ clear: boolean }>(event)
    await invalidateSession(event, clear)
})