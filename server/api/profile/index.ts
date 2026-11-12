export default defineEventHandler(async (event) => {
    return await authenticateProfile(event)
})