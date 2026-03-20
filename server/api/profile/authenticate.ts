export default defineEventHandler(async (event) => {
    return await authenticateRequest(event)
})