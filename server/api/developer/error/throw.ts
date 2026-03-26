export default defineEventHandler(async (event) => {
    await authenticateRequest(event)
    throw createError({
        status: 500,
        statusText: "Example Server Error",
        message: "This is additional messaging information that is available.",
        data: {
            id: 1,
            sql: "SELECT * FROM ALL",
        },
    })
})