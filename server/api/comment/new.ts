import { Comment } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const comment = await readBody(event);
    const user = await authenticateRequest(event);
    comment.user = user.id;
    comment.votes.positive = [user.id]
    return await queryOne<Comment>([
        `CREATE comment CONTENT ${JSON.stringify(comment)}`
    ])
})