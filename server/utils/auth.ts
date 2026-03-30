import { H3Event } from "h3"
import type { Session, User } from '@@/shared/types'

class SessionManager {

    async add(user: User) {
        let session = await new DatabaseQuery()
            .addSql(`
                CREATE session SET
                    user = $user;
            `)
            .addParameter("user", user.id)
            .queryOne<Session>()

        session.user = user as User & string

        await new DatabaseQuery()
            .addSql(`
                DELETE session
                WHERE user = $user
                AND (invalidated = true OR time::now()-time > 14d);
            `)
            .addRecord("user", session.user.id)
            .execute()

        return session
    }

    async authenticateLogin(id: string, password: string) {
        const user = await new DatabaseQuery()
            .addSql(`
                SELECT *
                OMIT password
                FROM user
                WHERE (email = $id OR name = $id)
                AND crypto::argon2::compare(password, $password);
            `)
            .addParameter("id", id)
            .addParameter("password", password)
            .queryOne<User>()

        return await this.add(user);
    }

    async authenticateToken(id: string) {
        return await new DatabaseQuery()
            .addSql(`
                SELECT *
                FROM session
                WHERE id = $id
                AND invalidated = false
                FETCH user;
            `)
            .addRecord("id", id)
            .queryOne<Session>()
    }

    async invalidateToken(id: string, clear: boolean) {
        if (clear) {
            await new DatabaseQuery()
                .addSql(`
                    UPDATE session SET
                        invalidated = true
                    WHERE id = $id;
                `)
                .addRecord("id", id)
                .execute()
        }
    }

    async invalidateUser(userId: string) {
        await new DatabaseQuery()
            .addSql(`
                UPDATE session SET
                    invalidated = true
                WHERE user = $user;
            `)
            .addRecord("user", userId)
            .execute()
    }
}

const sessionManager = new SessionManager()

export const registerUser = async (event: H3Event) => {
    const register = await readBody<{ email: string, username: string, password: string, referral?: string }>(event)
    const valid = useValidation()

    if (!valid.user.email(register.email) || !valid.user.name(register.username) || !valid.user.password(register.password)) {
        throw createError({
            status: 400,
            statusText: "Invalid user registration information."
        })
    }
    
    const user = await new DatabaseQuery()
        .addSql(`
            CREATE user SET
                email = $email,
                name = $username,
                password = crypto::argon2::generate($password);
        `)
        .addParameter("email", register.email)
        .addParameter("username", register.username)
        .addParameter("password", register.password)
        .queryOne<User>()
    
    const session = await sessionManager.add(user)

    if (register.referral) {
        await ReferralManager.claimReferral(user, register.referral)
    }

    return session.id
}

export const authenticateLogin = async (event: H3Event) => {
    try {
        const header = atob(getHeader(event, 'Authorization') ?? "")
        const [username, password] = header.split(":", 2)
        const session = await sessionManager.authenticateLogin(username!, password!)
        event.context.user = session.user.id
        return { tokens: { access: session.id }, user: session.user }
    }
    catch (error: any) {
        throw createError({
            status: 401,
            statusText: "Failed to authenticate login.",
            message: error.message,
            stack: error.stack,
        })
    }
}

export const authenticateRequest = async (event: H3Event): Promise<User> => {
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        let session = await sessionManager.authenticateToken(token)
        event.context.user = session.user.id
        return session.user
    }
    catch (error: any) {
        throw createError({
            status: 401,
            statusText: "Failed to authenticate request.",
            message: error.message,
            stack: error.stack,
        })
    }
}

export const invalidateSession = async (event: H3Event, clear: boolean) => {
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        await sessionManager.invalidateToken(token, clear)
    }
    catch (error: any) {
        throw createError({
            status: 403,
            statusText: "You aren't allowed invalidate this session.",
            message: error.message,
            stack: error.stack,
        })
    }
}