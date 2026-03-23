import { H3Event } from "h3"
import type { User } from '~/types'

export const authenticateLogin = async (event: H3Event) => {
    try {
        const sessionManager = useSessions()
        const header = atob(getHeader(event, 'Authorization') ?? "")
        const session = await sessionManager.authenticateLogin(header.split(":")[0], header.split(":")[1])
        return { tokens: { access: session.id }, user: session.user }
    }
    catch (error: any) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to authenticate login.",
        })
    }
}

export const authenticateRequest = async (event: H3Event): Promise<User> => {
    try {
        const sessionManager = useSessions()
        const token = getHeader(event, 'Authorization') ?? ""
        let session = await sessionManager.authenticateToken(token)
        return session.user

    }
    catch (error: any) {
        throw createError({
            status: 401,
            statusText: "Failed to authenticate request."
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
            statusCode: 400,
            statusMessage: "You aren't allowed invalidate this session.",
        })
    }
}