import type { PasswordReset, Account } from "@@/shared/types"


export default defineEventHandler(async (event) => {
    const { id } = await readBody<{ id: string }>(event)
    const settings = await SettingsManager.get()
    const startTime = Date.now()
    
    try {
        const account = await new DatabaseQuery()
            .addSql(`
                SELECT id, email, user.name
                FROM account
                WHERE user.name = $id
                OR email = $id
            `)
            .addParameter('id', id)
            .queryOne<Account>()
    
        const passwordReset = await new DatabaseQuery()
            .addSql(`
                CREATE passwordReset SET
                    account = $account
            `)
            .addRecord('account', account.id)
            .queryOne<PasswordReset>()
    
        const { public: { baseUrl } } = useRuntimeConfig()
        let template = await useStorage("assets:server").getItem("templates/reset-password.html") as string
        template = template.replace('{{user.email}}', account.email)
        template = template.replace('{{user.name}}', account.user.name)
        template = template.replace('{{resetPasswordLink}}', `${baseUrl}/settings/reset-password?id=${extractId(passwordReset.id)}`)
        template = template.replace('{{reportLink}}', `${baseUrl}/settings/reset-password?report=${extractId(passwordReset.id)}`)
        template = template.replace('{{supportEmail}}', settings.email.support ?? "support@example.com")
        
        await sendEmail({
            recipient: account.email,
            subject: `Reset Password: ${account.user.name}`,
            text: 'password reset request.',
            html: template
        })
    }
    catch (error) {
        console.log(error)
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
