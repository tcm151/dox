import type { Comment } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { content } = await readBody<{ content: string }>(event)
    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    
    sql.push('IF <record>$comment.user = <record>$user {')
    sql.push('RETURN UPDATE comment SET')
    sql.push('content = $content,')
    sql.push('edited = true,')
    sql.push('timeEdited = time::now()')
    sql.push('WHERE id = <record>$comment')
    sql.push('}')
    
    parameters['comment'] = `comment:${id}`
    parameters['content'] = content
    parameters['user'] = auth.id
    
    return await queryOne<Comment>({ sql, parameters })

})