import { User } from '~/types/types';
import Surreal from 'surrealdb.js';

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
        let response = await db.query<any>([
            `SELECT *`,
            `FROM user`,
            `WHERE id = $auth.id`,
        ].join("\n"))
        return response[0].result[0];
    }
    catch (ex) {
        throw createError({ statusCode: 401, message: "Failed to authenticate request." })
    }
}

export const queryOne = async <T>(sql: string[]) => {
    let response = await db.query<DatabaseResponse<T>[]>(sql.join("\n"));
    return response[0].result[0];
}

export const queryAll = async <T>(sql: string[]) => {
    let response = await db.query<DatabaseResponse<T>[]>(sql.join("\n"));
    return response[0].result;
}

export const multiQuery = async <T>(sql: string[]) => {
    let responses = await db.query<DatabaseResponse<T>[]>(sql.join("\n"));
    return responses.map(r => r.result);
}