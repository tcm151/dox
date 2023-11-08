import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!;
    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $post SET')
    sql.push('visits += 1')
    parameters['post'] = `post:${id}`
    return await queryOne<Post>({ sql, parameters })
})