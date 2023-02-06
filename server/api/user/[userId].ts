import { Post, User } from "~/types/types";
import { queryAll, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const { userId } = event.context.params;
    return {
        user: await queryOne<User>([
            `SELECT id, name, dateCreated, followers, following, topics`,
            `FROM user:${userId}`,
        ]),
        posts: await queryAll<Post>([
            `SELECT id, title, topics, comments, time, votes, user.id, user.name`,
            `FROM post`,
            `WHERE user = user:${userId}`,
            `ORDER BY time DESC`,
            `FETCH user`,
        ])
    }
})