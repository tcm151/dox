import type { Confirmation, AppSettings } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    // TODO pull into server utility 
    const appSettings = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM appSettings:default
        `)
        .queryOne<AppSettings>()

    const confirmation = await new DatabaseQuery()
        .addSql(`
            CREATE confirmation SET
            user = $user
        `)
        .addRecord('user', auth.id)
        .queryOne<Confirmation>()

    const { public: { baseUrl } } = useRuntimeConfig()
    let template = await useStorage("assets:server").getItem("templates/confirm-account.html") as string
    template = template.replace('{{user.email}}', auth.email)
    template = template.replace('{{user.name}}', auth.name)
    template = template.replace('{{confirmLink}}', `${baseUrl}/profile?confirmation=${confirmation.id}`)
    template = template.replace('{{reportLink}}', `${baseUrl}/profile?report=${confirmation.id}`)
    template = template.replace('{{supportEmail}}', appSettings.email.support ?? "support@example.com")

    const email = useEmail()
    return await email.sendMessage({
        recipient: auth.email,
        subject: `Confirm Account: ${auth.name}`,
        text: 'account verification.',
        html: template
    })
})
