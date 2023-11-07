import type { User } from "~/types"

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

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT * FROM $confirmation')
    sql.push('FETCH user')
    parameters['confirmation'] = confirmationId
    const confirmation = await queryOne<Confirmation>({ sql, parameters })

    if (confirmation.expired) {
        throw createError({
            statusCode: 400,
            message: "Confirmation period has expired, please try again and complete within 15 minutes."
        })
    }

    if (confirmation.used) {
        throw createError({
            statusCode: 400,
            message: "This confirmation has already been used."
        })
    }

    if (confirmation.user.id === auth.id) {
        var { sql, parameters } = queryBuilder()
        sql.push(' UPDATE $user SET')
        sql.push('confirmed = true;')
        sql.push('UPDATE $confirmation SET')
        sql.push('used = true;')
        parameters['user'] = auth.id
        parameters['confirmation'] = confirmationId
        await multiQuery({ sql, parameters })
        
        return true
    }

    return false
})
