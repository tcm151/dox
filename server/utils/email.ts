import * as nodemailer from "nodemailer"

const { smtp } = useRuntimeConfig()
const client =  nodemailer.createTransport({
    host: smtp.host,
    port: Number.parseInt(smtp.port),
    secure: false,
    auth: {
        user: smtp.user,
        pass: smtp.pass,
    }
})

interface Email {
    recipient: string
    subject: string
    text?: string
    html: string
}

export const useEmail = () => {
    async function sendMessage(email: Email) {
        return client.sendMail({
            from: '"DOX Official" <tylermckay10@gmail.com>',
            to: email.recipient,
            subject: email.subject,
            text: email.text ?? 'Oops.',
            html: email.html
        })
    }
    return { sendMessage }
}