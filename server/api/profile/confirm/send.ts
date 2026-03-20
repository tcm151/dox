import type { User, Confirmation } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const confirmation = await new DatabaseQuery()
        .addSql(`
            CREATE confirmation SET
            user = $user,
            time = time::now(),
            used = false,
            expired = <future> { time::now() > time + 15m }
        `)
        .addRecord('user', auth.id)
        .queryOne<Confirmation>()

    const { public: { baseUrl } } = useRuntimeConfig()
    let template = await useStorage("assets:server").getItem("templates/confirm-account.html") as string
    template = template.replace('{{user.email}}', auth.email)
    template = template.replace('{{user.name}}', auth.name)
    template = template.replace('{{confirmLink}}', `${baseUrl}/profile?confirmation=${confirmation.id}`)
    template = template.replace('{{reportLink}}', `${baseUrl}/profile?report=${confirmation.id}`)

    const email = useEmail()
    return await email.sendMessage({
        recipient: auth.email,
        subject: `Confirm Account: ${auth.name}`,
        text: 'account verification.',
        html: template
    })
})
