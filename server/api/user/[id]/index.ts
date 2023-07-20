import { Post, User } from "~/types";
import { queryOne, queryAll } from "../../../utils/database";

export default defineEventHandler(async (event): Promise<{ user: User, posts: Post[] }> => {
    const { id } = event.context.params!;
    return {
        user: await queryOne<User>([`
            SELECT id, name, dateCreated, votes, followers, following, topics
            FROM user:${id}
        `]),
        posts: await queryAll<Post>([`
            SELECT id, title, topics, comments, time, votes, user.id, user.name
            FROM post
            WHERE user = user:${id}
            ORDER BY time DESC
            FETCH user
        `])
    }
})