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
    const register = await readBody<{ referral?: string }>(event)
    const header = atob(getHeader(event, 'Authorization') ?? "")
    
    const user = await new DatabaseQuery()
        .addSql(`
            CREATE user SET
                email = $email,
                name = $username,
                password = crypto::argon2::generate($password);
        `)
        .addParameter("email", header.split(":")[0])
        .addParameter("username", header.split(":")[1])
        .addParameter("password", header.split(":")[2])
        .queryOne<User>()
    
    const session = await sessionManager.add(user)

    if (register.referral) {
        await new DatabaseQuery()
            .addSql(`
                IF record::exists($recipient) {
                    UPDATE $recipient SET
                        tokens += 1024;
                    
                    CREATE notification SET
                        recipient = $recipient,
                        context = $context,
                        message = $message;
                };
            `)
            .addRecord("recipient", `user:${register.referral}`)
            .addRecord("context", session.user.id)
            .addParameter("message", `**${session.user.name}** used your referral\n> You gained 1024 free tokens. Don't forget to thank them!\n`)
            .queryAll<string>()
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