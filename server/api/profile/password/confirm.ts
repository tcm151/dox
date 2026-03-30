import type { User, PasswordReset } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        resetId: string,
        email: string,
        password: string
    }>(event)

    const passwordReset = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $passwordReset
            FETCH user
        `)
        .addRecord("passwordReset", `passwordReset:${body.resetId}`)
        .queryOne<PasswordReset>()

    if (passwordReset.expired) {
        throw createError({
            status: 400,
            statusText: "Reset request period has expired, please try again and complete within 15 minutes."
        })
    }

    if (passwordReset.used) {
        throw createError({
            status: 400,
            statusText: "This reset request has already been used."
        })
    }

    if (passwordReset.user.email !== body.email) {
        throw createError( {
            status: 400,
            statusText: "Email does not match with reset request."
        })   
    }

    return await new DatabaseQuery()
        .addSql(`
            UPDATE user SET
            password = crypto::argon2::generate($password)
            WHERE email = $email;

            UPDATE $passwordReset SET
            used = true;
        `)
        .addParameter("email", body.email)
        .addParameter("password", body.password)
        .addRecord("passwordReset", `passwordReset:${body.resetId}`)
        .execute()
})
