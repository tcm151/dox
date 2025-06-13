export default defineEventHandler(async (event) => {
    return await authenticateLogin(event)
})