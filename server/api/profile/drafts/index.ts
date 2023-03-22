import { Post } from "~/types/types";
import { queryAll, authenticateRequest } from "../../../database";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    return await queryAll<Post>([`
        SELECT *
        FROM post
        WHERE draft = true
          AND user = ${auth.id}
        ORDER BY time DESC
    `])
})