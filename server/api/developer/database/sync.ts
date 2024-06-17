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

    let schema = Buffer.from(await useStorage("assets:server").getItem<string>("schema.surql") ?? "").toString()
    let migrations = Buffer.from(await useStorage("assets:server").getItem<string>("migrations.surql") ?? "").toString()
    return await complexQuery({ sql: [migrations, schema] })
})