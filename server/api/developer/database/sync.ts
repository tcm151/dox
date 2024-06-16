export default defineEventHandler(async (event) => {
    if (!ENV.isDevelopment()) {
        const auth = await authenticateRequest(event)
        if (!auth.admin) {
            throw createError({
                statusCode: 401,
                message: "You shall not pass!"
            })
        }
    }

    let schema = await useStorage("assets:server").getItem<string>("schema.surql") ?? ""
    // let migrations = await useStorage("assets:server").getItem<string>("migrations.surql") ?? ""
    console.log(schema)
    
    return await complexQuery({ sql: [schema] })
})