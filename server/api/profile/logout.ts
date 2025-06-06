export default defineEventHandler(async (event) => {
    return await invalidateSession(event)
})