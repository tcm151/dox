import { Draft } from "~/types/types";
import { authenticateRequest, queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { draftId } = event.context.params!;
    const auth = await authenticateRequest(event);
    let draft = await queryOne<any>([`
        SELECT *
        FROM draft:${draftId}
    `])
    if (draft.user === auth.id) {
        const post = await readBody(event);
        return await queryOne<Draft>([`
            UPDATE draft:${draftId} SET
            title = "${post.title}"
            content = "${post.content}",
            topics = ${post.topics}
            timeEdited = time::now()
        `])
    }
})