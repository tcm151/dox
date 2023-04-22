import * as nodemailer from "nodemailer"

// TODO host own SMTP email server to send legit emails
// TODO use .env to populate username and password


export const useEmail = async () => {
    const { smtp } = useRuntimeConfig()
    return nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: false,
        auth: {
            user: smtp.user,
            pass: smtp.pass,
        }
    })
}