import Surreal from 'surrealdb.js';

const db = await (async () => {
    const { surreal } = useRuntimeConfig();
    if (surreal.url == "" || !surreal.url.includes("/rpc")) {
        throw createError({
            statusCode: 500,
            message: `Database URL was [${surreal.url ?? "empty"}]. Check environment variables.`
        })
    }
    const db = new Surreal(surreal.url);
    try {
        await db.signin({ user: surreal.username, pass: surreal.password });
        await db.use(surreal.namespace, surreal.database);
        console.log(`Connected to ${surreal.namespace}:${surreal.database}`)
    }
    catch (ex: any) {
        console.log("Unable to connect to ${surreal.namespace}:${surreal.database}...")
        console.log(ex.message)
    }
    return db
})()



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
    await db.wait()
    const response = await db.query(sql.join("\n"), parameters ?? {}) as DatabaseResponse<T>[]
    if (response[0].status == 'ERR') {
        throw createError({
            statusCode: 500,
            message: response[0].details
        })
    }
    return response
}

export async function queryOne<T>(sql: string[], parameters?: Parameters): Promise<T> {
    let responses = await handleQuery<T>(sql, parameters)
    return responses[0].result[0]
}

export async function queryAll<T>(sql: string[], parameters?: Parameters): Promise<T[]> {
    let response = await handleQuery<T>(sql, parameters) 
    return response[0].result
}

export async function multiQuery(sql: string[], parameters?: Parameters): Promise<void> {
    await handleQuery(sql, parameters)
}