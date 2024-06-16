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

    const schema = await useStorage("assets:server").getItem<string>("schema.surql") ?? ""
    console.log(typeof schema)

    return schema.toString()
    
    // return await complexQuery({ sql: [`INFO FOR DB;`] })
})