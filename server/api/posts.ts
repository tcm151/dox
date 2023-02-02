import { useDatabase } from "../database";

export default defineEventHandler(async (event) => {
    const db = await useDatabase();
    const query = [
        `SELECT id, title, topics, comments, time, votes, user.id, user.name`,
        `FROM post`,
        `ORDER BY time DESC`,
        `LIMIT 24`,
        `FETCH user`,
    ]
    let result = await db.query<any[]>(query.join(" "));
    return result[0].result;
})