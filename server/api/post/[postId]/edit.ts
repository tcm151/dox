import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    
    const { postId } = event.context.params!;
    let post = await queryOne<Post>([`
        SELECT *
        FROM post:${postId}
    `])
    if (post.user === auth.id) {
        const content = await readBody(event);
        return await queryOne<Post>([`
            UPDATE post:${postId} SET
            content = $content,
            edited = true,
            timeEdited = time::now()
        `], { content })
    }
})