export default defineEventHandler(async (event) => {
    if (!ENV.isDevelopment()) {
        const auth = await authenticateRequest(event)
        if (!hasRole(auth, "admin")) {
            throw createError({
                statusCode: 401,
                message: "You shall not pass!"
            })
        }
    }
    
    let { query } = await readBody<{ query: string }>(event)
    return await complexQuery({ sql: [query] })
})