import Surreal from 'surrealdb.js'

const { surreal } = useRuntimeConfig()
if (surreal.url == "" || !surreal.url.includes("/rpc")) {
    throw createError({
        statusCode: 500,
        message: `Database URL was [${surreal.url ?? "empty"}]. Check environment variables.`
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
}

export function queryBuilder(): { sql: string[], parameters: Parameters } {
    return {
        sql: [],
        parameters: {}
    }
}

async function handleQuery<T>(query: Query) {
    try {
        const responses = await db.query(query.sql.join("\n"), query.parameters ?? {}) as T[][]
        // console.log(responses)
        return responses
    }
    catch (ex: any) {

        console.log(ex)

        throw createError({
            fatal: true,
            statusCode: 500,
            message: "Internal Server Error."
            // message: responses.find(r => r.status == 'ERR')?.result.toString() ?? "UNKNOWN ERROR."
        })
    }
}

export async function queryOne<T>(query: Query): Promise<T> {
    let responses = await handleQuery<T>(query)
    return responses[0][0]
}

export async function queryAll<T>(query: Query): Promise<T[]> {
    let response = await handleQuery<T>(query) 
    return response[0]
}

export async function multiQuery(query: Query): Promise<any[]> {
    return await handleQuery<any>(query)
}

export async function complexQuery(query: Query): Promise<unknown[][]> {
    const responses = await handleQuery(query)
    // return responses.map(r => r.result)
    // return responses.flatMap(r => r)
    return responses
}