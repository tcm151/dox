import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { content } = await readBody<{ content: string }>(event)
    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()

    sql.push('IF $post.user = $user {')
    sql.push('RETURN UPDATE $post SET')
    sql.push('content = $content,')
    sql.push('edited = true,')
    sql.push('timeEdited = time::now();')
    sql.push('}')
    
    parameters['post'] = `post:${id}`
    parameters['user'] = auth.id
    parameters['content'] = content

    return await queryOne<Post>({ sql, parameters })
})