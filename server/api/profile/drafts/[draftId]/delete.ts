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
        return await queryOne<Draft>([`
            DELETE draft:${draftId}
        `])
    }

    return false
})