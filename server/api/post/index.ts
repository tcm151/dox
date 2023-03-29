import { Post } from "~/types";
import { queryAll } from "../../database";

export default defineEventHandler(async (event) => {
    let { page, pageSize } = getQuery(event)
    return await queryAll<Post>([`
        SELECT id, title, topics, comments, time, votes, user.id, user.name
        FROM post
        ORDER BY time DESC
        LIMIT ${Number(pageSize ?? 5)}
        START ${(Number(page) - 1) * Number(pageSize ?? 5)}
        FETCH user
    `])
})