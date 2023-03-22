import { Notification } from "~/types/types";
import { authenticateRequest, queryAll } from "../../../database";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    return await queryAll<Notification>([`
        SELECT *
        FROM notification
        WHERE recipient = ${auth.id}
        ORDER BY time DESC
        FETCH context
    `])
})