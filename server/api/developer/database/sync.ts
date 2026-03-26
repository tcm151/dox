export default defineEventHandler(async (event) => {
    if (!ENV.isDevelopment()) {
        const auth = await authenticateRequest(event)
        requireRole(auth, "developer")
    }

    let migrations = Buffer.from(await useStorage("assets:server").getItem<string>("migrations.surql") ?? "").toString()
    let schema = Buffer.from(await useStorage("assets:server").getItem<string>("schema.surql") ?? "").toString()
    
    return await new DatabaseQuery()
        .addSql(schema)
        .addSql(migrations)
        .execute()
})