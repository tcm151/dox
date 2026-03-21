import type { User } from "~/types"

interface Register {
    email: string,
    username: string,
    password: string,
    referral?: string
}

export default defineEventHandler(async (event) => {
    const register = await readBody<Register>(event)
    
    const user = await new DatabaseQuery(SurrealInstance)
        .addSql(`
            CREATE user SET
            email = $email,
            name = $username,
            password = crypto::argon2::generate($password),
            dateJoined = time::now()
        `)
        .addParameter("email", register.email)
        .addParameter("username", register.username)
        .addParameter("password", register.password)
        .queryOne<User>()
    
    const sessionManager = useSessions()
    const session = await sessionManager.add(user)

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

    return session.id
})
