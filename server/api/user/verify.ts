import { useEmail } from "~/server/email"
import { getTestMessageUrl } from "nodemailer"

export default defineEventHandler(async (event) => {
    const client = await useEmail()
    return await client.sendMail({
        from: '"DOX Official" <tylermckay10@gmail.com>',
        to: 'tylermckay10@gmail.com',
        subject: 'Example email!',
        text: 'Just some text...',
        html: '<div>HTML!</div>'
    })
})
