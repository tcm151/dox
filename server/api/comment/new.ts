import { Comment } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const comment = await readBody(event);
    await authenticateRequest(event);
    return await queryOne<Comment>([
        `CREATE comment CONTENT ${JSON.stringify(comment)}`
    ])
})