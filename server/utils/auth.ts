import Surreal from 'surrealdb.js'
import { H3Event } from "h3"
import type { User } from '~/types'

const connections: Surreal[]  = []

async function openConnection(): Promise<Surreal> {
    if (connections.length > 0) {
        return connections.shift()!
    }
    else {
        const db = new Surreal()
        const config = useRuntimeConfig()
        await db.connect(config.surreal.url)
        return db
    }
}

async function returnConnection(db: Surreal) {
    try {
        await db.invalidate()
        connections.push(db)
    }
    catch (ex: any) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to close connection.",
            message: ex.message,
        })
    }
}

export const authenticateRequest = async (event: H3Event) => {
    try {
        const token = getHeader(event, 'Authorization') ?? ""
        const sessionManager = useSessions()
        const user = sessionManager.isAuthenticated(token)
        if (user != undefined) {
            return user;
        }
        else {
            const db = await openConnection()
            await db.authenticate(token)
            let user = await db.query("SELECT * OMIT password FROM $auth;") as unknown as User[][]
            sessionManager.add(token, user[0][0])
            returnConnection(db)
            return user[0][0]
        }
    }
    catch (ex: any) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to authenticate request.",
            message: ex.message,
        })
    }
}

export const invalidateSession = async (event: H3Event) => {
    try {
        const sessionManager = useSessions()
        const token = getHeader(event, 'Authorization') ?? ""
        const auth = sessionManager.isAuthenticated(token)
        if (auth != undefined) {
            sessionManager.invalidate(token)
        }
    }
    catch (ex: any) {
        throw createError({
            statusCode: 400,
            statusMessage: "You aren't allowed invalidate this session.",
            message: ex.message,
        })
    }
}