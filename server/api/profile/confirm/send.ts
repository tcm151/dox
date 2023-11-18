import type { User, Confirmation } from "~/types"

// REFACTOR to new query standards
export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { sql, parameters } = queryBuilder()
    sql.push('CREATE confirmation SET')
    sql.push('user = $user,')
    sql.push('time = time::now(),')
    sql.push('used = false,')
    sql.push('expired = <future> { time::now() > time + 15m }')
    parameters['user'] = auth.id
    const confirmation = await queryOne<Confirmation>({ sql, parameters })

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
