import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const feedback = await readBody(event)
    feedback.user = auth.id

    return await new DatabaseQuery()
        .addSql(`
            CREATE feedback
            CONTENT $feedback
        `)
        .addParameter('feedback', feedback)
        .queryOne<Feedback>()
})