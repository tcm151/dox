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
        await db.connect(config.surreal.url, {
            namespace: config.surreal.namespace,
            database: config.surreal.database,
        })
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

export const authenticateRequest = async (event: H3Event): Promise<User> => {
    try {
        const sessionManager = useSessions()
        const token = getHeader(event, 'Authorization') ?? ""
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

export const authenticateLogin = async (event: H3Event): Promise<string> => {
    try {
        const sessionManager = useSessions()
        const header = atob(getHeader(event, 'Authorization') ?? "")
        const db = await openConnection()
        const token = await db.signin({
            scope: "account",
            password: header.split(":")[1],
            id: header.split(":")[0],
        })
        let user = await db.query("SELECT * OMIT password FROM $auth;") as unknown as User[][]
        sessionManager.add(token, user[0][0])
        returnConnection(db)
        return token
    }
    catch (ex: any) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to authenticate login.",
            message: ex.message,
        })
    }
}

export const invalidateSession = async (event: H3Event) => {
    try {
        const sessionManager = useSessions()
        const token = getHeader(event, 'Authorization') ?? ""
        sessionManager.invalidate(token)
        return token
    }
    catch (ex: any) {
        throw createError({
            statusCode: 400,
            statusMessage: "You aren't allowed invalidate this session.",
            message: ex.message,
        })
    }
}