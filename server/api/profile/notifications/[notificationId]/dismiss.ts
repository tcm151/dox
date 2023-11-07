import type { Notification } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { notificationId } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $notification')
    parameters['notification'] = `notification:${notificationId}`
    let notification = await queryOne<Notification>({ sql, parameters })

    if (notification.recipient === auth.id) {
        var { sql, parameters } = queryBuilder()
        sql.push('UPDATE $notification SET')
        sql.push('viewed = true')
        parameters['notification'] = `notification:${notificationId}`
        return await queryOne<Notification>({ sql, parameters })
    }
})