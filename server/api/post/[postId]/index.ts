import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    return await queryOne<Post>([`
        SELECT id, title, content, topics, time, votes, edited, timeEdited, user.id, user.name, visits
        FROM post
        WHERE id = post:${postId}
        FETCH user
    `])
})