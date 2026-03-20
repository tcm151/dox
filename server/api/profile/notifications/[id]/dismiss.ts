import type { Notification } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const notification = await new DatabaseQuery()
        .addSql(`
            IF $notification.recipient = $user {
                RETURN UPDATE $notification SET
                viewed = true;
            }
            ELSE {
                RETURN false;
            }
        `)
        .addRecordId("notification", `notification:${id}`)
        .addRecordId("user", auth.id)
        .queryOne<Notification>()

    return notification.viewed
})