import { Notification } from "~/types";
import { queryAll } from "../../../utils/database";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    return await queryAll<Notification>([`
        SELECT *
        FROM notification
        WHERE recipient = ${auth.id}
          AND viewed = false
        ORDER BY time DESC
        FETCH context
    `])
})