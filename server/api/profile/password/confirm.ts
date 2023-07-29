import { User } from "~/types"

interface PasswordReset {
    id: string
    user: User
    time: string
    used: boolean
    expired: boolean
}
export default defineEventHandler(async (event) => {
    const body = await readBody<{
        resetId: string,
        email: string,
        password: string
    }>(event)

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT * FROM $passwordReset')
    sql.push('FETCH user')
    parameters['passwordReset'] = `passwordReset:${body.resetId}`
    const passwordReset = await queryOne<PasswordReset>({ sql, parameters })

    if (passwordReset.expired) {
        throw createError({
            statusCode: 400,
            message: "Reset request period has expired, please try again and complete within 15 minutes."
        })
    }

    if (passwordReset.used) {
        throw createError({
            statusCode: 400,
            message: "This reset request has already been used."
        })
    }

    if (passwordReset.user.email !== body.email) {
        throw createError( {
            statusCode: 400,
            message: "Email does not match with reset request."
        })   
    }

    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE user SET')
    sql.push('password = crypto::argon2::generate($password)')
    sql.push('WHERE email = $email;')
    parameters['email'] = body.email
    parameters['password'] = body.password
    sql.push('UPDATE $passwordReset SET')
    sql.push('used = true;')
    parameters['passwordReset'] = `passwordReset:${body.resetId}`
    return await multiQuery({ sql, parameters })
})
