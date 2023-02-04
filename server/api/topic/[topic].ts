import { useDatabase } from "../../database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params;
    const db = await useDatabase();
    const query = [
        `SELECT * FROM post WHERE topics CONTAINS "${topic}";`,
        `SELECT count() FROM post WHERE topics CONTAINS "${topic}" GROUP BY ALL;`,
        `SELECT count() FROM user WHERE topics CONTAINS "${topic}" GROUP BY ALL;`,
    ]
    let result = await db.query<any[]>(query.join(" "));
    
    return  {
        posts: result[0].result ?? [],
        postCount: result[1].result[0]?.count ?? 0,
        followerCount: result[2].result[0]?.count ?? 0,
    }
})