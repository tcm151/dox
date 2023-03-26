import Surreal from 'surrealdb.js';
import { User } from '~/types';

interface DatabaseResponse<T> {
    status: string
    time: string
    result: T[]
}

export const useDatabase = async () => {
    const { surrealDatabaseUrl, surrealUsername, surrealPassword } = useRuntimeConfig();
    const db = new Surreal(surrealDatabaseUrl);
    await db.signin({ user: surrealUsername, pass: surrealPassword });
    await db.use("dev", "dox");
    return db;
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

export const queryOne = async <T>(sql: string[], parameters?: QueryParameters) => {
    let response = await db.query<DatabaseResponse<T>[]>(sql.join("\n"), parameters ?? {});
    return response[0].result[0];
}

export const queryAll = async <T>(sql: string[], parameters?: QueryParameters) => {
    let response = await db.query<DatabaseResponse<T>[]>(sql.join("\n"), parameters ?? {});
    return response[0].result;
}

export const multiQuery = async <T>(sql: string[], parameters?: QueryParameters) => {
    let responses = await db.query<DatabaseResponse<T>[]>(sql.join("\n"), parameters ?? {});
    return responses.map(r => r.result);
}