import { queryOne } from "~/server/database";
import { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const feedback = await readBody(event);
    const auth = await authenticateRequest(event);
    feedback.user = auth.id;
    return await queryOne<Feedback>([`
        CREATE feedback
        CONTENT ${JSON.stringify(feedback)}
    `])
})