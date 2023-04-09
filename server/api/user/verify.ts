import { useEmail } from "~/server/email"
import { getTestMessageUrl } from "nodemailer"

export default defineEventHandler(async (event) => {
    const client = await useEmail()

    let email = await client.sendMail({
        from: '"DOX Official" <official@doxforeverything.ca>',
        to: 'tylermckay10@gmail.com',
        subject: 'Example email!',
        text: 'Just some text...',
        html: '<div>HTML!</div>'
    })

    return getTestMessageUrl(email)
})
