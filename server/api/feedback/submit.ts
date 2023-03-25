import { authenticateRequest, queryOne } from "~/server/database";

export default defineEventHandler(async (event) => {
    const feedback = await readBody(event);
    const auth = await authenticateRequest(event);
    feedback.user = auth.id;
    return await queryOne<any>([`
        CREATE feedback
        CONTENT ${JSON.stringify(feedback)}
    `])
})