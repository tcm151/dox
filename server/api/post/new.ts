import { Post } from "~/types/types";
import { queryOne, useDatabase } from "../../database";

export default defineEventHandler(async (event) => {
    const post = await readBody(event);
    return await queryOne<Post>([
        `CREATE post CONTENT ${JSON.stringify(post)}`
    ])
})