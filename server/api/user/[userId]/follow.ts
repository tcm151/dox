import { authenticateRequest, queryOne } from "../../../database";

export default defineEventHandler(async (event) => {
    const { userId } = event.context.params;
    const auth = await authenticateRequest(event);
    await queryOne([
        `UPDATE ${auth.id} SET`,
        `following += user:${userId}`,
    ])
    await queryOne([
        `UPDATE user:${userId} SET`,
        `followers += ${auth.id}`,
    ])
    return true;
})