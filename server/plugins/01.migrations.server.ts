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

        console.log("Database migrations completed successfully.")

        if (config.surreal.admin.email && config.surreal.admin.name && config.surreal.admin.password) {
            const result = await new DatabaseQuery()
                .addSql(`
                    IF array::len(SELECT VALUE id FROM user) = 0 {
                        
                        LET $user = (
                            CREATE ONLY user SET
                                name = $name,
                                roles = ["moderator", "admin", "developer"],
                                traits = ["confirmed", "verified"]
                        );
    
                        CREATE account SET
                            user = $user.id,
                            email = $email,
                            password = crypto::argon2::generate($password);
                    };
                `)
                .addParameter("email", config.surreal.admin.email)
                .addParameter("name", config.surreal.admin.name)
                .addParameter("password", config.surreal.admin.password)
                .execute()

            if (result[0]) {
                console.log("Created default admin user with supplied .env credentials.")
            }
        }
    }
    catch (error: any) {
        throw createError({
            status: 500,
            statusText: "Failed to apply database migrations on application startup.",
            message: error.message,
            stack: error.stack,
        })
    }
})
