import { Post } from "~/types/types";
import { queryAll } from "../database";

export default defineEventHandler(async (event) => {
    return await queryAll<Post>([`
        SELECT id, title, topics, comments, time, votes, user.id, user.name
        FROM post
        WHERE draft = null OR draft = false
        ORDER BY time DESC
        LIMIT 24
        FETCH user
    `])
})