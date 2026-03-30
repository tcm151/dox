import { H3Event } from "h3"
import type { User } from '@@/shared/types'

interface RegistrationRequest {
    email: string
    username: string
    password: string
    referral?: string
}

export const registerUser = async (event: H3Event) => {
    try {
        const { username, email, password, referral } = await readBody<RegistrationRequest>(event)
        const { user, account } = await UserManager.create(email, username, password)
        const session = await SessionManager.add(account)
        if (referral) {
            await ReferralManager.claimReferral(user, referral)
        }
        return session.id
    }
    catch (error: any) {
        throw createError({
            status: 400,
            statusText: "Failed to register user.",
            message: error.message,
            stack: error.stack,
        })
    }
}

export const authenticateLogin = async (event: H3Event) => {
    try {
        const header = atob(getHeader(event, 'Authorization') ?? "")
        const [username, password] = header.split(":", 2)
        const session = await SessionManager.authenticateLogin(username!, password!)
        event.context.account = session.account
        return { tokens: { access: session.id }, user: session.account.user }
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
        let session = await SessionManager.authenticateToken(token)
        event.context.account = session.account
        return session.account.user
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
        if (clear) {
            await SessionManager.invalidateToken(token)
        }
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