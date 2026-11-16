import type { Notification } from "@@/shared/types"

interface NotificationQuery {
    dismissed: string
    amount: number
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const query = getQuery<NotificationQuery>(event)

    // TODO notifications shouldn't be filtered, the should be blocked at the source instead
    const databaseQuery = new DatabaseQuery()
        .addSql(`
            RETURN SELECT id, recipient, context, message, time, viewed
            FROM notification
            WHERE recipient = $user
            AND ($dismissed = true OR ($dismissed = false AND viewed = false))
            ORDER BY time DESC
        `)
        .addRecord("user", auth.id)
        .addParameter("dismissed", JSON.parse(query.dismissed))
    const notifications = await databaseQuery.queryAll<Notification>()

    return {
        total: notifications.length,
        notifications: notifications.slice(0, query.amount)
    }
})