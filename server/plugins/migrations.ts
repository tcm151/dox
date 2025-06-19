export default defineNitroPlugin(async () => {
    try {
        let schema = Buffer.from(await useStorage("assets:server").getItem<string>("schema.surql") ?? "").toString()
        let migrations = Buffer.from(await useStorage("assets:server").getItem<string>("migrations.surql") ?? "").toString()
        await complexQuery({ sql: [migrations, schema] })
        console.log("Database migrations completed successfully")
    }
    catch (ex: any) {
        throw createError({
            statusCode: 500,
            message: "Failed to apply database migrations on application startup."
        })
    }
})
