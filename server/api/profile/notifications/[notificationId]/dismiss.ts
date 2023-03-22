import { Notification } from "~/types/types";
import { authenticateRequest, queryOne } from "../../../../database";

export default defineEventHandler(async (event) => {
    const { notificationId } = event.context.params!;
    const auth = await authenticateRequest(event);
    let notification = await queryOne<any>([`
        SELECT *
        FROM notification:${notificationId}
    `])
    if (notification.recipient === auth.id) {
        return await queryOne<Notification>([`
            UPDATE notification:${notificationId} SET
            viewed = true
        `])
    }
})