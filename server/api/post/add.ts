import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event);
    let post = await readBody<Post>(event)
    post.user = auth.id;
    post.votes.positive = [auth.id]

    var { sql, parameters } = queryBuilder()
    sql.push('CREATE post')
    sql.push('CONTENT $post')
    parameters['post'] = post
    
    return await queryOne<Post>({ sql, parameters })
})