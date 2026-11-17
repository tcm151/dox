import type { Notification } from "@@/shared/types"
import { Validator } from "@@/shared/utils/Validator"

interface NotificationQuery {
    dismissed: string
    amount: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const query = getQuery<NotificationQuery>(event)
    const amount = Number(query.amount)

    new Validator("NotificationQuery")
        .string(query.dismissed, "dismissed")
        .in(query.dismissed, "dismissed", ["true", "false"])
        .string(query.amount, "amount")
        .notEmpty(query.amount, "amount")
        .integer(amount, "amount", { min: 0 })
        .confirm()

    const dismissed = query.dismissed === "true"
    if (amount === 0) {
        const { total } = await new DatabaseQuery()
            .addSql(`
                SELECT COUNT() AS total
                FROM notification
                WHERE recipient = $user
                AND ($dismissed = true OR ($dismissed = false AND viewed = false))
                GROUP ALL
            `)
            .addRecord("user", auth.id)
            .addParameter("dismissed", dismissed)
            .queryOne<{ total: number }>()

        return { total, notifications: [] }
    }

    const notifications = await new DatabaseQuery()
        .addSql(`
            RETURN SELECT id, recipient, context, message, time, viewed
            FROM notification
            WHERE recipient = $user
            AND ($dismissed = true OR ($dismissed = false AND viewed = false))
            ORDER BY time DESC
        `)
        .addRecord("user", auth.id)
        .addParameter("dismissed", dismissed)
        .queryAll<Notification>()

    return {
        total: notifications.length,
        notifications: notifications.slice(0, amount)
    }
})