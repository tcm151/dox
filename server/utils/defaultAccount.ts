type DefaultAccount = {
    email?: string
    name?: string
    password?: string
}

export async function setupDefaultAccount(config: DefaultAccount) {
    
    const accounts = await new DatabaseQuery()
        .addSql(`
            SELECT VALUE id
            FROM account
            LIMIT 1`)
        .queryAll<string>()

    if (accounts.length === 0) {
        const credentials = [config.email, config.name, config.password]

        if (!credentials.every(Boolean)) {
            throw new Error("No accounts exist. Set NUXT_SURREAL_ADMIN_EMAIL, NUXT_SURREAL_ADMIN_NAME, and NUXT_SURREAL_ADMIN_PASSWORD to create the required default account.")
        }

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
            .addParameter("email", config.email)
            .addParameter("name", config.name)
            .addParameter("password", config.password)
            .execute()

        console.log("Created default account with supplied .env credentials.")
    }
}