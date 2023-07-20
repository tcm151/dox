import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { postId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE report SET')
    sql.push('subject = $post,')
    sql.push('reporter = $user,')
    sql.push('time = time::now()')
    parameters['post'] = `post:${postId}`
    parameters['user'] = auth.id
    
    return await queryOne<Post>({ sql, parameters })
})