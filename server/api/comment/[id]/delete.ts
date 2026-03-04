import type { Comment } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    
    const { sql, parameters } = queryBuilder()
    
    sql.push('IF $comment.user = $user {')
    sql.push('RETURN UPDATE $comment SET')
    sql.push('content = "[deleted]",')
    sql.push('deleted = true')
    sql.push('}')
    
    parameters['comment'] = `comment:${id}`
    parameters['user'] = auth.id
    
    return await queryOne<Comment>({ sql, parameters })

})