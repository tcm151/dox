import { Post } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const post = await readBody(event)
    const user = await authenticateRequest(event);
    post.user = user.id;
    post.votes.positive = [user.id]
    return await queryOne<Post>([
        `CREATE post CONTENT ${JSON.stringify(post)}`
    ])
})