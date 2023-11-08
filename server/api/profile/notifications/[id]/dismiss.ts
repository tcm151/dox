import type { Notification } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    let { sql, parameters } = queryBuilder()

    sql.push('IF $notification.recipient = $user.id {')
    sql.push('RETURN UPDATE $notification SET')
    sql.push('viewed = true;')
    sql.push('};')

    parameters['notification'] = `notification:${id}`
    parameters['user'] = auth

    return await queryOne<Notification>({ sql, parameters })
})