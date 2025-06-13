export default defineEventHandler(async (event) => {
    await authenticateRequest(event)
    return getHeader(event, 'Authorization') ?? ""
})