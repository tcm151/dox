import { Draft } from "~/types";
import { queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const { draftId } = event.context.params!;
    const auth = await authenticateRequest(event);
    let draft = await queryOne<Draft>([`
        SELECT *
        FROM draft:${draftId}
    `])
    if (draft.user === auth.id) {
        const draft = await readBody(event);
        return await queryOne<Draft>([`
            UPDATE draft:${draftId} SET
            title = $title,
            content = $content,
            topics = $topics,
            timeEdited = time::now()
        `], {
            title: draft.title,
            content: draft.content,
            topics: draft.topics,
        })
    }
})