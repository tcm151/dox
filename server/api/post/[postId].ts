import { useDatabase } from "../../database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params;
    const db = await useDatabase();
    const query = [
        `SELECT id, title, content, topics, time, votes, user.id, user.name`,
        `FROM post`,
        `WHERE id = post:${postId}`,
        `FETCH user`,
    ]
    let result = await db.query<any[]>(query.join(" "));
    return result[0].result[0];
})