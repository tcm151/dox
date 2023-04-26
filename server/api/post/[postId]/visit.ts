import { Post } from "~/types";
import { queryOne } from "../../../database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    return await queryOne<Post>([`
        UPDATE post:${postId} SET
        visits += 1
    `])
})