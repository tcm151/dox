import { isError, type H3Event } from "h3"
import type { User } from '@@/shared/types'
import { ReferralManager } from "@@/server/utils/repos/ReferralManager"
import { SessionManager } from "@@/server/utils/repos/SessionManager"
import { UserManager } from "@@/server/utils/repos/UserManager"

interface RegistrationRequest {
    email: string
    username: string
    password: string
    referral?: string
}

export const registerUser = async (event: H3Event) => {
    try {
        const { username, email, password, referral } = await readBody<RegistrationRequest>(event)
        if (referral) {
            await ReferralManager.validateReferral(referral)
        }
        const { user, account } = await UserManager.create(email, username, password)
        if (referral) {
            await ReferralManager.claimReferral(user, referral)
        }
        const session = await SessionManager.add(account)
        return session.id
    }
    catch (error) {
        if (isError(error)) {
            throw error
        }
        throw createError({
            status: 400,
            statusText: "Failed to register user.",
        })
    }
}

export const authenticateLogin = async (event: H3Event) => {
    try {
        const header = atob(getHeader(event, 'Authorization') ?? "")
        const [username, password] = header.split(":", 2)
        const session = await SessionManager.authenticateLogin(username!, password!)
        event.context.account = session.account
        return {
            tokens: { access: session.id },
            user: session.account.user,
        }
    }
    catch (error) {
        if (isError(error) && error.statusCode >= 500) {
            throw error
        }
        throw createError({
            status: 401,
            statusText: "Failed to authenticate login.",
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
    catch (error) {
        if (isError(error) && error.statusCode >= 500) {
            throw error
        }
        throw createError({
            status: 401,
            statusText: "Failed to authenticate request.",
        })
    }
}

export const authenticateOptionalRequest = async (event: H3Event): Promise<User | undefined> => {
    const token = getHeader(event, "Authorization")
    if (!token) return undefined
    return await authenticateRequest(event)
}

export const authenticateProfile = async (event: H3Event): Promise<User> => {
    return await authenticateRequest(event)
}

export const invalidateSession = async (event: H3Event, clear: boolean) => {
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        if (clear) {
            await SessionManager.invalidateToken(token)
        }
    }
    catch (error) {
        if (isError(error) && error.statusCode >= 500) {
            throw error
        }
        throw createError({
            status: 403,
            statusText: "You aren't allowed invalidate this session.",
        })
    }
}