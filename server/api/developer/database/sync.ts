export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }

    let schema = await useStorage("assets:server").getItem<string>("schema.surql")
    let migrations = await useStorage("assets:server").getItem<string>("migrations.surql")
    return await multiQuery({ sql: [schema ?? "", migrations ?? ""] })
})