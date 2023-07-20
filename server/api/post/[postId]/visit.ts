import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    return await queryOne<Post>([`
        UPDATE post:${postId} SET
        visits += 1
    `])
})