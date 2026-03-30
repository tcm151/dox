export default defineEventHandler(async (event) => {
    const body = await readBody<{ id: string, email: string, password: string }>(event)
    const valid = useValidation()

    if (!valid.user.email(body.email) || !valid.user.password(body.password)) {
        throw createError({
            status: 400,
            statusText: "Invalid user password reset information."
        })
    }

    try {
        await new DatabaseQuery()
            .addSql(`
                IF $passwordReset.expired {
                    THROW "Reset period has expired, please try again and complete within 15 minutes."
                };
                IF $passwordReset.used {
                    THROW "This password reset has already been used.";
                };
                IF $passwordReset.account.email != $email {
                    THROW "Email does not match with reset request.";
                };
    
                RETURN {
                    UPDATE account SET
                        password = crypto::argon2::generate($password)
                    WHERE id = $passwordReset.account.id;
        
                    UPDATE $passwordReset SET
                        used = true;
                };
    
            `)
            .addParameter("email", body.email)
            .addParameter("password", body.password)
            .addRecord("passwordReset", `passwordReset:${body.id}`)
            .execute()
    }
    catch (error: any) {
        throw createError({
            status: 400,
            statusText: "Unable to process password reset request.",
            message: error.message,
            stack: error.stack,
        })
    }
})
