import * as nodemailer from "nodemailer"

// TODO host own SMTP email server to send legit emails
// TODO use .env to populate username and password

export const useEmail = async () => {
    const testAccount = await nodemailer.createTestAccount()
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        }
    })
}