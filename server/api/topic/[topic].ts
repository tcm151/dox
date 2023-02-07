import { Post } from "~/types/types";
import { queryOne, queryAll } from "../../database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params;
    return  {
        posts: await queryAll<Post>([
            `SELECT *`,
            `FROM post`,
            `WHERE topics CONTAINS "${topic}"`,
            `FETCH user`,
        ]),
        followers: await queryOne<{ count: number }>([
            `SELECT count()`,
            `FROM user`,
            `WHERE topics CONTAINS "${topic}"`,
            `GROUP BY ALL`,
        ])
    }
})