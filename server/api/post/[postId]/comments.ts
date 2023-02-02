import { useDatabase, useDatabaseAuth } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params;
    const db = await useDatabase();
    const query = [
        `SELECT id, time, user.id, user.name, post.id, replyTo, content, votes`,
        `FROM comment`,
        `WHERE post.id = post:${postId}`,
        `FETCH user, post`,
    ]
    let result = await db.query<any[]>(query.join(" "));
    return result[0].result;
})