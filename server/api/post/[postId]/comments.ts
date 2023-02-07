import { Comment } from "~/types/types";
import { queryAll, useDatabase } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params;
    return await queryAll<Comment>([
        `SELECT id, time, user.id, user.name, post.id, replyTo, content, votes`,
        `FROM comment`,
        `WHERE post.id = post:${postId}`,
        `FETCH user, post`,
    ])
})