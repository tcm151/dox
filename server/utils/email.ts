import * as nodemailer from "nodemailer"

const { smtp } = useRuntimeConfig()
const client = nodemailer.createTransport({
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

export async function sendEmail(email: Email) {
    return await client.sendMail({
        from: smtp.title,
        to: email.recipient,
        subject: email.subject,
        text: email.text ?? 'Oops.',
        html: email.html
    })
}