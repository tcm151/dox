import { User } from '~/types/types';
import Surreal from 'surrealdb.js';

interface DatabaseResponse<T> {
    status: string
    time: string
    result: T[]
}

const { surrealDatabaseUrl, surrealUsername, surrealPassword } = useRuntimeConfig();
let db = new Surreal(surrealDatabaseUrl);

export const useDatabase = async () => {
    await db.signin({ user: surrealUsername, pass: surrealPassword });
    await db.use("dev", "dox");
    return db;
}

export const authenticateRequest = async (event: any) => {
    try {
        await useDatabase()
        const token = getHeader(event, 'Authorization');
        await db.authenticate(token ?? "");
        return await queryOne<User>([
            `SELECT *`,
            `FROM user`,
            `WHERE id = $auth.id`,
        ]);
    }
    catch (ex) {
        throw createError({ statusCode: 401, message: "Failed to authenticate request." })   
    }
}

export const queryOne = async <T>(sql: string[]) => {
    await useDatabase();
    let response = await db.query<DatabaseResponse<T>[]>(sql.join("\n"));
    return response[0].result[0];
}

export const queryAll = async <T>(sql: string[]) => {
    await useDatabase();
    let response = await db.query<DatabaseResponse<T>[]>(sql.join("\n"));
    return response[0].result;
}

export const multiQuery = async <T>(sql: string[]) => {
    await useDatabase();
    let responses = await db.query<DatabaseResponse<T>[]>(sql.join("\n"));
    return responses.map(r => r.result);
}