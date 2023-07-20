import { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    
    const feedback = await readBody(event);
    feedback.user = auth.id;
    
    return await queryOne<Feedback>([`
        CREATE feedback
        CONTENT ${JSON.stringify(feedback)}
    `])
})