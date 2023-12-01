export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }

    return await complexQuery({ sql: [`INFO FOR DB;`] })
})