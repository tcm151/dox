export default defineNitroPlugin(async () => {
    try {
        const config = useRuntimeConfig()

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

        if (config.surreal.admin.email && config.surreal.admin.name && config.surreal.admin.password) {
            console.log("Creating default admin user if it does not already exist...")
            await new DatabaseQuery()
                .addSql(`
                    IF (SELECT VALUE id FROM user).len() = 0 {
                        CREATE user SET
                            email = $email,
                            name = $name,
                            password = crypto::argon2::generate($password),
                            roles = ["admin", "developer"],
                            traits = ["confirmed", "verified"];
                    };
                `)
                .addParameter("email", config.surreal.admin.email)
                .addParameter("name", config.surreal.admin.name)
                .addParameter("password", config.surreal.admin.password)
                .execute()
        }

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
