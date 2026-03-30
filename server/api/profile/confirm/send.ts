import type { Confirmation, AppSettings } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const settings = await settingsManager.get()

    if (!event.context.account.email) {
        throw createError({
            status: 401,
            statusText: "Unable to verify request email."
        })
    }

    const confirmation = await new DatabaseQuery()
        .addSql(`
            CREATE confirmation SET
                account = $account
        `)
        .addRecord('account', auth.id)
        .queryOne<Confirmation>()

    const { public: { baseUrl } } = useRuntimeConfig()
    let template = await useStorage("assets:server").getItem("templates/confirm-account.html") as string
    template = template.replace('{{user.email}}', event.context.account.email)
    template = template.replace('{{user.name}}', auth.name)
    template = template.replace('{{confirmLink}}', `${baseUrl}/profile?confirmation=${confirmation.id}`)
    template = template.replace('{{reportLink}}', `${baseUrl}/profile?report=${confirmation.id}`)
    template = template.replace('{{supportEmail}}', settings.email.support ?? "support@example.com")

    return await sendEmail({
        recipient: event.context.account.email,
        subject: `Confirm Account: ${event.context.account.email}`,
        text: 'account verification.',
        html: template
    })
})
