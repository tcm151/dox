import type { Comment } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    const { id } = event.context.params!
    const { sql, parameters } = queryBuilder()
    
    sql.push('IF <record>$comment.user = <record>$user {')
    sql.push('RETURN UPDATE comment SET')
    sql.push('content = $content,')
    sql.push('deleted = true')
    sql.push('WHERE id = <record>$comment')
    sql.push('}')
    parameters['comment'] = `comment:${id}`
    parameters['content'] = "[deleted]"
    parameters['user'] = auth.id
    
    return await queryOne<Comment>({ sql, parameters })

})