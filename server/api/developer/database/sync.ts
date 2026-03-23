export default defineEventHandler(async (event) => {
    if (!ENV.isDevelopment()) {
        const auth = await authenticateRequest(event)
        requireRole(auth, "developer")
    }

    let schema = Buffer.from(await useStorage("assets:server").getItem<string>("schema.surql") ?? "").toString()
    let migrations = Buffer.from(await useStorage("assets:server").getItem<string>("migrations.surql") ?? "").toString()
    
    return await new DatabaseQuery()
        .addSql(migrations)
        .addSql(schema)
        .execute()
})