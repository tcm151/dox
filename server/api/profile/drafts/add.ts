import { Draft } from "~/types";
import { queryOne } from "../../../utils/database";

export default defineEventHandler(async (event) => {
    const draft = await readBody(event)
    const auth = await authenticateRequest(event);
    draft.user = auth.id;
    return await queryOne<Draft>([`
        CREATE draft
        CONTENT ${JSON.stringify(draft)}
    `])
})