import { Comment } from "~/types/types";
import { queryAll } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    return await queryAll<Comment>([
        `SELECT id, time, user.id, user.name, post.id, replyTo, content, votes, edited, timeEdited`,
        `FROM comment`,
        `WHERE post.id = post:${postId}`,
        `FETCH user, post`,
    ])
})