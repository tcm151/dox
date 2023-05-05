import { queryOne } from "~/server/database"
import { User } from "~/types"

interface Confirmation {
    id: string
    user: User
    time: string
    used: boolean
    expired: boolean
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const confirmation = await queryOne<Confirmation>([`
        CREATE confirmation SET
        user = ${auth.id},
        time = time::now(),
        used = false,
        expired = <future> { time::now() > time + 15m }
    `])

    let template = await useStorage("assets:server").getItem("verify-user.html") as string
    template = template.replace('{{user.email}}', auth.email)
    template = template.replace('{{user.name}}', auth.name)
    // TODO replace this with environment variables
    template = template.replace('{{confirmLink}}', `https://doxforeverything.tcmdev.ca/profile?confirmation=${confirmation.id}`)
    template = template.replace('{{reportLink}}', `https://doxforeverything.tcmdev.ca/profile?report=${confirmation.id}`)

    
    return await useEmail().sendMessage({
        recipient: 'tylermckay10@gmail.com',
        subject: `Confirm Account: ${auth.name}`,
        text: 'account verification.',
        html: template
    })
})
