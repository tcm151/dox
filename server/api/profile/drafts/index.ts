import { Draft } from "~/types";
import { queryAll } from "../../../utils/database";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    return await queryAll<Draft>([`
        SELECT *
        FROM draft
        WHERE user = ${auth.id}
        ORDER BY time DESC
    `])
})