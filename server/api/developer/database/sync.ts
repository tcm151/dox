export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }

    let schema = await useStorage("assets:server").getItem<string>("schema.surql")
    return await multiQuery({ sql: [schema ?? ""] })
})