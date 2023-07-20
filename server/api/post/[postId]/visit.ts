import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $post SET')
    sql.push('visits += 1')
    parameters['post'] = `post:${postId}`
    return await queryOne<Post>({ sql, parameters })
})