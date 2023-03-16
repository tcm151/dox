import { Comment } from "~/types/types";
import { authenticateRequest, queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { commentId } = event.context.params!;
    const auth = await authenticateRequest(event);
    let comment = await queryOne<any>([`
        SELECT *
        FROM comment:${commentId}
    `])
    if (comment.user === auth.id) {
        const content = await readBody(event);
        return await queryOne<Comment>([`
            UPDATE comment:${commentId} SET
            content = "${content}",
            edited = true,
            timeEdited = time::now()
        `])
    }
})