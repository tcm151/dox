import { Surreal } from 'surrealdb'
import { H3Event } from "h3"
import { DatabaseQuery } from './database'
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
        })
    }
}

export const authenticateRequest = async (event: H3Event): Promise<User> => {
    try {
        const sessionManager = useSessions()
        const token = getHeader(event, 'Authorization') ?? ""
        let session = await sessionManager.authenticateToken(token)
        if (!session) {
            const userConnection = await openConnection()
            await userConnection.authenticate(token)

            let user = await new DatabaseQuery(userConnection)
                .addSql(`
                    SELECT *
                    OMIT password
                    FROM $auth
                `)
                .queryOne<User>()

            session = await sessionManager.add(token, user)
        }
        return session.user
    }
    catch (ex: any) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to authenticate request.",
        })
    }
}

export const authenticateLogin = async (event: H3Event) => {
    try {
        const sessionManager = useSessions()
        const header = atob(getHeader(event, 'Authorization') ?? "")
        const userConnection = await openConnection()
        const tokens = await userConnection.signin({
            access: "account",
            variables: {
                id: header.split(":")[0],
                password: header.split(":")[1],
            }
        })

        let user = await new DatabaseQuery(userConnection)
            .addSql(`
                SELECT *
                OMIT password
                FROM $auth
            `)
            .queryOne<User>()

        sessionManager.add(tokens.access, user)
        returnConnection(userConnection)
        return { tokens, user }
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
        sessionManager.invalidateToken(token, clear)
    }
    catch (ex: any) {
        throw createError({
            statusCode: 400,
            statusMessage: "You aren't allowed invalidate this session.",
        })
    }
}