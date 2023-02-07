import { Post } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const post = await readBody(event)
    const auth = await authenticateRequest(event);
    post.user = auth.id;
    post.votes.positive = [auth.id]
    return await queryOne<Post>([
        `CREATE post CONTENT ${JSON.stringify(post)}`
    ])
})