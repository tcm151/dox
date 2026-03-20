import { Surreal } from "surrealdb"

interface Register {
    email: string,
    username: string,
    password: string,
    referral?: string
}

export default defineEventHandler(async (event) => {
    const register = await readBody<Register>(event)
    
    const { surreal } = useRuntimeConfig()
    const db = new Surreal()
    await db.connect(surreal.url)
    
    const tokens = await db.signup({
        namespace: surreal.namespace,
        database: surreal.database,
        access: "account",
        variables: {
            email: register.email,
            username: register.username,
            password: register.password,
        },
    });

    const session = getSession()
    session.tokens = tokens
    await session.refreshProfile()

    if (register.referral) {
        await new DatabaseQuery()
            .addSql(`
                RETURN {
                    IF $user != NONE {
                        UPDATE $user SET tokens += 1024;
                    };

                    CREATE notification SET
                    recipient = $recipient,
                    context = $context,
                    message = $message;
                    
                    RETURN "Referral completed successfully.";
                };
            `)
            .addRecord("user", `user:${register.referral}`)
            .addRecord("recipient", `user:${register.referral}`)
            .addRecord("context", session.user.id)
            .addParameter("message", [
                `**${session.user.name}** used your referral`,
                `> You gained 1024 free tokens. Don't forget to thank them!\n`,
            ].join('\n'))
            .queryAll<string>()
    }

    await db.close()
    return tokens
})
