import { H3Event } from "h3"
import type { User } from '~/types'

export const authenticateLogin = async (event: H3Event) => {
    try {
        const sessionManager = useSessions()
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
        const sessionManager = useSessions()
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
        const sessionManager = useSessions()
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