import type { Notification } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, recipient, context, message, time, viewed')
    sql.push('FROM notification')
    sql.push('WHERE recipient = $user')
    sql.push('AND viewed = false')
    sql.push('ORDER BY time DESC')
    parameters['user'] = auth.id
    
    return await queryAll<Notification>({ sql, parameters })
})