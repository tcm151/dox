import { H3Event } from "h3"
import { DatabaseQuery } from './database'
import type { User } from '~/types'

export const authenticateRequest = async (event: H3Event): Promise<User> => {
    const sessionManager = useSessions()
    const token = getHeader(event, 'Authorization') ?? ""
    let session = await sessionManager.authenticateToken(token)
    if (!session) {
        throw createError({
            status: 401,
            statusText: "Failed to authenticate request."
        })
    }
    return session.user
}

export const authenticateLogin = async (event: H3Event) => {
    try {
        const sessionManager = useSessions()
        const header = atob(getHeader(event, 'Authorization') ?? "")

        const user = await new DatabaseQuery(SurrealInstance)
            .addSql(`
                SELECT *
                OMIT password
                FROM user
                WHERE (email = $id OR name = $id)
                AND crypto::argon2::compare(password, $password)
            `)
            .addParameter("id", header.split(":")[0])
            .addParameter("password", header.split(":")[1])
            .queryOne<User>()

        const session = await sessionManager.add(user)
        return { tokens: { access: session.id }, user }
    }
    catch (ex: any) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to authenticate login.",
        })
    }
}

export const invalidateSession = async (event: H3Event, clear: boolean) => {
    try {
        const sessionManager = useSessions()
        const token = getHeader(event, 'Authorization') ?? ""
        await sessionManager.invalidateToken(token, clear)
    }
    catch (ex: any) {
        throw createError({
            statusCode: 400,
            statusMessage: "You aren't allowed invalidate this session.",
        })
    }
}