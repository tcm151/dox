import * as nodemailer from "nodemailer"

export const useEmail = () => {
    const { smtp } = useRuntimeConfig()
    return nodemailer.createTransport({
        host: smtp.host,
        port: Number.parseInt(smtp.port),
        secure: false,
        auth: {
            user: smtp.user,
            pass: smtp.pass,
        }
    })
}