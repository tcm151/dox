export default defineNitroPlugin(async () => {
    try {
        await new DatabaseQuery()
            .addSql(
                Buffer.from(await useStorage("assets:server")
                    .getItem<string>("schema.surql") ?? "")
                    .toString()
            )
            .addSql(
                Buffer.from(await useStorage("assets:server")
                    .getItem<string>("migrations.surql") ?? "")
                    .toString()
            )
            .execute()
            
        console.log("Database migrations completed successfully.")
    }
    catch (error: any) {
        throw createError({
            statusCode: 500,
            statusText: "Failed to apply database migrations on application startup.",
            message: error.message
        })
    }
})
