import type { User } from "~/types"

interface PasswordReset {
    id: string
    user: User
    time: string
    used: boolean
    expired: boolean
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { sql, parameters } = queryBuilder()
    sql.push('CREATE passwordReset SET')
    sql.push('user = $user,')
    sql.push('time = time::now(),')
    sql.push('used = false,')
    sql.push('expired = <future> { time::now() > time + 15m }')
    parameters['user'] = auth.id
    const passwordReset = await queryOne<PasswordReset>({ sql, parameters })

    const { public: { baseUrl } } = useRuntimeConfig()
    let template = await useStorage("assets:server").getItem("reset-password.html") as string
    template = template.replace('{{user.email}}', auth.email)
    template = template.replace('{{user.name}}', auth.name)
    template = template.replace('{{resetPasswordLink}}', `${baseUrl}/settings/reset-password?id=${extractId(passwordReset.id)}`)
    template = template.replace('{{reportLink}}', `${baseUrl}/settings/reset-password?report=${extractId(passwordReset.id)}`)
    
    return await useEmail().sendMessage({
        recipient: auth.email,
        subject: `Reset Password: ${auth.name}`,
        text: 'password reset request.',
        html: template
    })
})
