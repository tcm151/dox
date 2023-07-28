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
    const db = new Surreal(surreal.url)
    const token = await db.signup({
        NS: surreal.namespace,
        DB: surreal.database,
        SC: "account",
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

    const auth = await $fetch('/api/profile', {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    if (referral) {
        const { sql, parameters } = queryBuilder()
        sql.push('IF $user != NONE THEN')
        sql.push('(UPDATE $user SET tokens += 1024)')
        sql.push('END;')
        parameters['user'] = `user:${referral}`
        
        sql.push('CREATE notification SET')
        sql.push('recipient = $user,')
        sql.push('context = $context,')
        sql.push('message = $message,')
        sql.push('time = time::now(),')
        sql.push('viewed = false;')
        parameters['recipient'] = `user:${referral}`
        parameters['context'] = auth.id
        parameters['message'] = [
            `**${auth.name}** used your referral`,
            `> You gained 1024 free tokens. Don't forget to thank them!\n`,
        ].join('\n')
        
        await multiQuery({ sql, parameters })
    }

    return token
})
