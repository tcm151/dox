import { queryOne } from "../../../utils/database";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!;
    const auth = await authenticateRequest(event);
    return await queryOne([`
        UPDATE ${auth.id} SET
        topics += topic:${topic}
    `])
})