import Surreal from 'surrealdb.js';
import { User } from '~/types';

export const useDatabase = async () => {
    try {
        const { surrealDatabaseUrl, surrealUsername, surrealPassword } = useRuntimeConfig();
        // INFO url needs to be https://link.to.db/rpc
        const db = new Surreal(surrealDatabaseUrl);
        await db.signin({ user: surrealUsername, pass: surrealPassword });
        await db.use("dev", "dox");
        console.log("Connected to the database.")
        return db
    }
    catch (ex: any) {
        console.log(ex.message)
    }
}
const db = await useDatabase();

export const authenticateRequest = async (event: any) => {
    try {
        const { surrealDatabaseUrl } = useRuntimeConfig();
        const db = new Surreal(surrealDatabaseUrl);
        const token = getHeader(event, 'Authorization');
        await db.authenticate(token ?? "");
        let response = await db.query<any>("SELECT * FROM user WHERE id = $auth.id")
        return (response[0].result[0] as User);
    }
    catch (ex) {
        throw createError({ statusCode: 401, message: "Failed to authenticate request." })
    }
}

interface QueryParameters {
    [key: string]: any
}

interface DatabaseResponse<T> {
    status: string
    details?: string
    time: string
    result: T[]
}

async function handleQuery<T>(sql: string[], parameters?: QueryParameters) {
    const response = await db?.query(sql.join("\n"), parameters ?? {}) as DatabaseResponse<T>[]
    if (response[0].status == 'ERR') {
        throw createError({ statusCode: 500, message: response[0].details })
    }
    return response
}

export async function queryOne<T>(sql: string[], parameters?: QueryParameters): Promise<T> {
    let responses = await handleQuery<T>(sql, parameters)
    return responses[0].result[0]
}

export async function queryAll<T>(sql: string[], parameters?: QueryParameters): Promise<T[]> {
    let response = await handleQuery<T>(sql, parameters) 
    return response[0].result
}

export async function multiQuery(sql: string[], parameters?: QueryParameters): Promise<void> {
    await handleQuery(sql, parameters)
}