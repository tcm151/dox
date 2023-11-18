import Surreal from "surrealdb.js";

interface Register {
    email: string,
    username: string,
    password: string,
    referral?: string
}

export default defineEventHandler(async (event) => {
    const { email, username, password, referral } = await readBody<Register>(event)
    
    const { surreal } = useRuntimeConfig()
    const db = new Surreal()
    await db.connect(surreal.url)
    
    const token = await db.signup({
        namespace: surreal.namespace,
        database: surreal.database,
        scope: "account",
        email: email,
        username: username,
        password: password,
        votes: {
            positive: [],
            misleading: [],
            negative: [],
        },
        topics: ["Admin"],
        followers: [],
        following: [],
    })

    // REFACTOR use session to grab this information!
    const auth = await $fetch('/api/profile', {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    if (referral) {
        const { sql, parameters } = queryBuilder()
        sql.push('RETURN {')
        sql.push('IF $user != NONE {')
        parameters['user'] = `user:${referral}`
        sql.push('UPDATE $user SET tokens += 1024;')
        sql.push('};')
        sql.push('CREATE notification SET')
        sql.push('recipient = $user,')
        sql.push('context = $context,')
        sql.push('message = $message')
        parameters['recipient'] = `user:${referral}`
        parameters['context'] = auth.id
        parameters['message'] = [
            `**${auth.name}** used your referral`,
            `> You gained 1024 free tokens. Don't forget to thank them!\n`,
        ].join('\n')
        sql.push('RETURN "Referral completed successfully.";')
        sql.push('};')
        await queryAll<string>({ sql, parameters })
    }

    await db.close()
    return token
})
