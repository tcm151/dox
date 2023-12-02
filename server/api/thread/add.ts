import type { Thread } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    let thread = await readBody<Thread>(event)
    thread.user = auth.id;
    thread.votes.positive = [auth.id]

    var { sql, parameters } = queryBuilder()
    sql.push('CREATE thread')
    sql.push('CONTENT $thread')
    parameters['thread'] = thread
    
    return await queryOne<Thread>({ sql, parameters })
})