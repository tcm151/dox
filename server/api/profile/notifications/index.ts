import type { Notification } from "@@/shared/types"

interface NotificationQuery {
    dismissed: string
    amount: number
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const query = getQuery<NotificationQuery>(event)

    const notifications = await new DatabaseQuery()
        .addSql(`
            SELECT id, recipient, context, message, time, viewed
            FROM notification
            WHERE recipient = $user
            AND ($dismissed = true OR ($dismissed = false AND viewed = false))
            ORDER BY time DESC
        `)
        .addRecord("user", auth.id)
        .addParameter("dismissed", JSON.parse(query.dismissed))
        .queryAll<Notification>()

    return {
        total: notifications.length,
        notifications: notifications.slice(0, query.amount)
    }
})