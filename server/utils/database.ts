import Surreal from 'surrealdb.js';

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

async function handleQuery<T>(sql: string[], parameters?: Parameters) {
    const responses = await db.query(sql.join("\n"), parameters ?? {}) as DatabaseResponse<T>[]
    if (responses.some(r => r.status == 'ERR')) {
        throw createError({
            statusCode: 500,
            message: responses.find(r => r.status == 'ERR')?.details
        })
    }
    return responses
}

export async function queryOne<T>(sql: string[], parameters?: Parameters): Promise<T> {
    let responses = await handleQuery<T>(sql, parameters)
    return responses[0].result[0]
}

export async function queryAll<T>(sql: string[], parameters?: Parameters): Promise<T[]> {
    let response = await handleQuery<T>(sql, parameters) 
    return response[0].result
}

export async function multiQuery(sql: string[], parameters?: Parameters): Promise<DatabaseResponse<any>[]> {
    return await handleQuery(sql, parameters)
}