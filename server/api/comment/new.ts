import { Comment } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const comment = await readBody(event);
    const auth = await authenticateRequest(event);
    comment.user = auth.id;
    comment.votes.positive = [auth.id]
    return await queryOne<Comment>([
        `CREATE comment CONTENT ${JSON.stringify(comment)}`
    ])
})