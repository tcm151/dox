import { Post } from "~/types/types";
import { authenticateRequest, queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    const auth = await authenticateRequest(event);
    let post = await queryOne<any>([`
        SELECT *
        FROM post:${postId}
    `])
    if (post.user === auth.id) {
        const content = await readBody(event);
        return await queryOne<Post>([`
            UPDATE post:${postId} SET
            content = "${content}",
            edited = true,
            timeEdited = time::now()
        `])
    }
})