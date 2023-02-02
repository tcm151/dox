import Surreal from 'surrealdb.js';
import { H3Event } from 'h3';

export const useDatabase = async () => {

    const { surrealDatabaseUrl, surrealUsername, surrealPassword } = useRuntimeConfig();
    
    const db = new Surreal(surrealDatabaseUrl);
    await db.signin({ user: surrealUsername, pass: surrealPassword });
    await db.use("dev", "dox");
    
    return db;
}

export const useDatabaseAuth = async (event: H3Event) => {
    const { surrealDatabaseUrl } = useRuntimeConfig();
    
    try {
        const db = new Surreal(surrealDatabaseUrl);
        const token = getHeader(event, 'Authorization');
        await db.authenticate(token!);
        return db;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
}