export default defineNitroPlugin(async () => {
    const health = useHealth()

    try {
        health.setAppStatus("starting")
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

        const defaultAccount = [config.surreal.admin.email, config.surreal.admin.name, config.surreal.admin.password]
        if (defaultAccount.some(Boolean) && !defaultAccount.every(Boolean)) {
            throw new Error("Set all DEFAULT_USER_* values, or leave all three blank when an account already exists.")
        }

        const accounts = await new DatabaseQuery()
            .addSql(`SELECT VALUE id FROM account LIMIT 1`)
            .queryAll<unknown>()

        if (accounts.length === 0 && !defaultAccount.every(Boolean)) {
            throw new Error("No accounts exist. Set DEFAULT_USER_EMAIL, DEFAULT_USER_NAME, and DEFAULT_USER_PASSWORD to create the required default account.")
        }

        if (accounts.length === 0) {
            await new DatabaseQuery()
                .addSql(`
                    IF array::len(SELECT VALUE id FROM account LIMIT 1) = 0 {
                        
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

            console.log("Created default account with supplied .env credentials.")
        }

        health.setAppStatus("ready")
    }
    catch (error: any) {
        health.setAppStatus("failed")

        throw createError({
            status: 500,
            statusText: "Application startup failed.",
            message: error.message,
            stack: error.stack,
        })
    }
})
