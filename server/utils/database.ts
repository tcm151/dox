import Surreal from 'surrealdb.js'

const { surreal } = useRuntimeConfig()
if (surreal.url == "" || !surreal.url.includes("/rpc")) {
    throw createError({
        statusCode: 500,
        statusMessage: `Database URL was [${surreal.url ?? "empty"}]. Check environment variables.`
    })
}

const db = new Surreal();
(async () => {
    return await db.connect(surreal.url, {
        namespace: surreal.namespace,
        database: surreal.database,
        auth: {
            username: surreal.username,
            password: surreal.password,
        },
        prepare: () => {
            console.log(`Connected to ${surreal.namespace}:${surreal.database}`)
        }
    })
})()

interface Parameters {
    [key: string]: any
}

export interface DatabaseResponse<T> {
    status: string
    detail?: string
    time: string
    result: T[]
}

interface Query {
    sql: string[]
    parameters?: Parameters
    label?: string
}

export function queryBuilder(): { sql: string[], parameters: Parameters } {
    return {
        sql: [],
        parameters: {},
    }
}

async function handleQuery<T>(query: Query) {
    try {
        return await db.query(query.sql.join("\n"), query.parameters ?? {}) as T[][]
    }
    catch (ex: any) {
        if (ex.message.startsWith("An error occurred:")) {
            const message = ex.message.split(":").at(1).trim()
            throw createError({
                fatal: true,
                statusCode: 500,
                statusMessage: message,
            })
        }
        else {
            throw createError({
                fatal: true,
                statusCode: 500,
                statusMessage: `API Error: ${query.label ?? "Unable to execute query."}`,
                message: ex.message
            })
        }
    }
}

export async function queryOne<T>(query: Query): Promise<T> {
    let responses = await handleQuery<T>(query)
    return responses[0]![0]!
}

export async function queryAll<T>(query: Query): Promise<T[]> {
    let response = await handleQuery<T>(query) 
    return response[0]!
}

export async function complexQuery(query: Query): Promise<unknown[][]> {
    const responses = await handleQuery(query)
    // maybe do something before just returning things
    return responses
}