import { multiQuery } from "../../../database";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!;
    const auth = await authenticateRequest(event);
    await multiQuery([`
        UPDATE ${auth.id} SET
        following += user:${id};
        
        UPDATE user:${id} SET
        followers += ${auth.id};
    `])
    return true;
})