import { useEmail } from "~/server/email"

export default defineEventHandler(async (event) => {
    const { } = await readBody<{}>(event)
    const client = useEmail()


    
    return await client.sendMail({
        from: '"DOX Official" <tylermckay10@gmail.com>',
        to: 'tylermckay10@gmail.com',
        subject: 'Example email!',
        text: 'Just some text...',
        html: '<div>HTML!</div>'
    })
})
