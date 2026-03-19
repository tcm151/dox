import type { User } from "~/types"

interface PasswordReset {
    id: string
    user: User
    time: string
    used: boolean
    expired: boolean
}

export default defineEventHandler(async (event) => {
    const startTime = Date.now()

    try {
        const { id } = await readBody(event)

        var { sql, parameters } = queryBuilder()
        sql.push('SELECT id, name, email')
        sql.push('FROM user')
        sql.push('WHERE name = $id')
        sql.push('OR email = $id')
        parameters['id'] = id
        const user = await queryOne<User>({ sql, parameters})
    
        if (user != undefined) {
            var { sql, parameters } = queryBuilder()
            sql.push('CREATE passwordReset SET')
            sql.push('user = $user,')
            sql.push('time = time::now(),')
            sql.push('used = false,')
            sql.push('expired = <future> { time::now() > time + 15m }')
            parameters['user'] = user.id
            const passwordReset = await queryOne<PasswordReset>({ sql, parameters })
        
            const { public: { baseUrl } } = useRuntimeConfig()
            let template = await useStorage("assets:server").getItem("templates/reset-password.html") as string
            template = template.replace('{{user.email}}', user.email)
            template = template.replace('{{user.name}}', user.name)
            template = template.replace('{{resetPasswordLink}}', `${baseUrl}/settings/reset-password?id=${extractId(passwordReset.id)}`)
            template = template.replace('{{reportLink}}', `${baseUrl}/settings/reset-password?report=${extractId(passwordReset.id)}`)
            
            await useEmail().sendMessage({
                recipient: user.email,
                subject: `Reset Password: ${user.name}`,
                text: 'password reset request.',
                html: template
            })
        }
    }
    catch (error) {
        // ignore for now
    }
    finally {
        const duration = Date.now() - startTime
        if (duration < 1000) {
            await new Promise(r => setTimeout(r, 1000 - duration))
        }

        return {
            message: "If an account with the provided email or username exists, a password reset link has been sent."
        }
    }
})
