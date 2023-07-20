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
    const confirmationId = await readBody<string>(event)

    const confirmation = await queryOne<Confirmation>([`
        SELECT * FROM ${confirmationId}
        FETCH user
    `])

    if (confirmation.expired) {
        throw createError({
            statusCode: 400,
            message: "Confirmation period has expired, please try and again complete within 15 minutes."
        })
    }

    if (confirmation.used) {
        throw createError({
            statusCode: 400,
            message: "This confirmation has already been used."
        })
    }

    if (confirmation.user.id === auth.id) {
        await multiQuery([`
            UPDATE ${auth.id} SET
            confirmed = true;

            UPDATE ${confirmation.id} SET
            used = true;
        `])
        return true
    }

    return false
})
