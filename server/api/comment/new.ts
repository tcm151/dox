import { Comment } from "~/types/types";
import { queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    const comment = await readBody(event);
    return await queryOne<Comment>([
        `CREATE feedback CONTENT ${JSON.stringify(comment)}`
    ])
})