import { Post } from "~~/types/types";
import { queryOne, queryAll, useDatabase } from "../database";

export default defineEventHandler(async (event) => {
    return await queryAll<Post>([
        `SELECT id, title, topics, comments, time, votes, user.id, user.name`,
        `FROM post`,
        `ORDER BY time DESC`,
        `LIMIT 24`,
        `FETCH user`,
    ])
})