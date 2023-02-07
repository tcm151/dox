import { Post } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const post = await readBody(event);
    await authenticateRequest(event);
    return await queryOne<Post>([
        `CREATE post CONTENT ${JSON.stringify(post)}`
    ])
})