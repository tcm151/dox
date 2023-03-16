import { authenticateRequest, multiQuery } from "../../../database";

export default defineEventHandler(async (event) => {
    const { userId } = event.context.params!;
    const auth = await authenticateRequest(event);
    await multiQuery([
        `UPDATE ${auth.id} SET`,
        `following -= user:${userId};`,
        `UPDATE user:${userId} SET`,
        `followers -= ${auth.id};`,
    ])
    return true;
})