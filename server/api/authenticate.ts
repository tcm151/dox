import { useDatabaseAuth } from "../database";

export default defineEventHandler(async (event) => {
    
    try {
        const db = await useDatabaseAuth(event);
        console.log("auth successful.");

        const query = [
            `SELECT id, name FROM user WHERE id = $auth.id;`,
        ]
        let result = await db?.query<any[]>(query.join(" "));
        return {
            success: true,
            user: result![0].result[0],
        }
    }
    catch (ex) {
        console.log(ex)
        return {
            success: false,
            user: null,
        }
    }

})