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

    const schema = await useStorage("assets:server").getItem<string>("schema.surql") ?? ""
    return Buffer.from(schema).toString()
})