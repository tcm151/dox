import { useDatabase, useDatabaseAuth } from "../database"

export default defineEventHandler(async (event) => {
    const { id, votes } = await readBody(event)
    
    try {
        const db = await useDatabase();

        const query = [
            `UPDATE ${id} SET votes = ${JSON.stringify(votes)};`,
        ]
        await db?.query<any[]>(query.join(" "));
        
        return true;
    }
    catch (ex) {
        console.log(ex)
        return false;
    }
})
