import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE report SET')
    sql.push('subject = $post,')
    sql.push('reporter = $user,')
    sql.push('time = time::now()')
    parameters['post'] = `post:${id}`
    parameters['user'] = auth.id
    
    return await queryOne<Post>({ sql, parameters })
})