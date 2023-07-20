import Surreal from 'surrealdb.js';
import { Post } from '~/types'

const { surreal } = useRuntimeConfig()
if (surreal.url == "" || !surreal.url.includes("/rpc")) {
    throw createError({
        statusCode: 500,
        message: `Database URL was [${surreal.url ?? "empty"}]. Check environment variables.`
    })
}

const db = new Surreal(surreal.url, {
    ns: surreal.namespace,
    db: surreal.database,
    auth: {
        user: surreal.username,
        pass: surreal.password,
    },
    prepare: async () => {
        console.log(`Connected to ${surreal.namespace}:${surreal.database}`)
    }
})

interface Parameters {
    [key: string]: any
}

export interface DatabaseResponse<T> {
    status: string
    details?: string
    time: string
    result: T[]
}

interface Query {
    sql: string[]
    parameters?: Parameters
}

export function queryBuilder(): { sql: string[], parameters: Parameters } {
    return {
        sql: [],
        parameters: {}
    }
}

async function handleQuery<T>(query: Query) {
    const responses = await db.query(query.sql.join("\n"), query.parameters ?? {}) as DatabaseResponse<T>[]
    if (responses.some(r => r.status == 'ERR')) {
        throw createError({
            statusCode: 500,
            message: responses.find(r => r.status == 'ERR')?.details
        })
    }
    return responses
}

export async function queryOne<T>(query: Query): Promise<T> {
    let responses = await handleQuery<T>(query)
    return responses[0].result[0]
}

export async function queryAll<T>(query: Query): Promise<T[]> {
    let response = await handleQuery<T>(query) 
    return response[0].result
}

export async function multiQuery(query: Query): Promise<DatabaseResponse<any>[]> {
    return await handleQuery(query)
}