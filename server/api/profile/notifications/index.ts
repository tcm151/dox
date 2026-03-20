import type { Notification } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, recipient, context, message, time, viewed
            FROM notification
            WHERE recipient = $user
            AND viewed = false
            ORDER BY time DESC
        `)
        .addRecord("user", auth.id)
        .queryAll<Notification>()
})