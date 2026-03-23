import type { User, AppSettings } from "~/types"

interface PasswordReset {
    id: string
    user: User
    time: string
    used: boolean
    expired: boolean
}

export default defineEventHandler(async (event) => {
    const startTime = Date.now()
    const { id } = await readBody<{ id: string }>(event)

    try {
        const user = await new DatabaseQuery()
            .addSql(`
                SELECT id, name, email
                FROM user
                WHERE name = $id
                OR email = $id
            `)
            .addParameter('id', id)
            .queryOne<User>()
    
        const appSettings = await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM appSettings:default
            `)
            .queryOne<AppSettings>()

        const passwordReset = await new DatabaseQuery()
            .addSql(`
                CREATE passwordReset SET
                user = $user
            `)
            .addRecord('user', user.id)
            .queryOne<PasswordReset>()
    
        const { public: { baseUrl } } = useRuntimeConfig()
        let template = await useStorage("assets:server").getItem("templates/reset-password.html") as string
        template = template.replace('{{user.email}}', user.email)
        template = template.replace('{{user.name}}', user.name)
        template = template.replace('{{resetPasswordLink}}', `${baseUrl}/settings/reset-password?id=${extractId(passwordReset.id)}`)
        template = template.replace('{{reportLink}}', `${baseUrl}/settings/reset-password?report=${extractId(passwordReset.id)}`)
        template = template.replace('{{supportEmail}}', appSettings.email.support ?? "support@example.com")
        
        await useEmail().sendMessage({
            recipient: user.email,
            subject: `Reset Password: ${user.name}`,
            text: 'password reset request.',
            html: template
        })
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
