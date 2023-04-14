import { Post } from "~/types";
import { queryOne } from "../../../database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    return await queryOne<Post>([`
        SELECT id, title, content, topics, time, votes, edited, timeEdited, user.id, user.name
        FROM post
        WHERE id = post:${postId}
        FETCH user
    `])
})