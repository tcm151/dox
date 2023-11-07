import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    const feedback = await readBody(event);
    feedback.user = auth.id;
    
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE feedback')
    sql.push('CONTENT $feedback')
    parameters['feedback'] = feedback
    
    return await queryOne<Feedback>({ sql, parameters })
})