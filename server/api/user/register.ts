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
        const { sql, parameters } = queryBuilder()
        sql.push('RETURN {')
        sql.push('IF $user != NONE {')
        parameters['user'] = `user:${register.referral}`
        sql.push('UPDATE <record>$user SET tokens += 1024;')
        sql.push('};')
        sql.push('CREATE notification SET')
        sql.push('recipient = $user,')
        sql.push('context = $context,')
        sql.push('message = $message')
        parameters['recipient'] = `user:${register.referral}`
        parameters['context'] = session.user.id
        parameters['message'] = [
            `**${session.user.name}** used your referral`,
            `> You gained 1024 free tokens. Don't forget to thank them!\n`,
        ].join('\n')
        sql.push('RETURN "Referral completed successfully.";')
        sql.push('};')
        await queryAll<string>({ sql, parameters })
    }

    await db.close()
    return tokens
})
