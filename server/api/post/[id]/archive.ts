import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $post SET')
    sql.push('archived = !archived')
    parameters['post'] = `post:${id}`
    parameters['user'] = auth.id
    return await queryOne<Post>({ sql, parameters })
})