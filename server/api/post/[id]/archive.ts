import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    
    sql.push('IF $user.roles CONTAINS "admin" {')
    sql.push('RETURN UPDATE $post SET')
    sql.push('archived = !archived')
    sql.push('}')

    parameters['post'] = `post:${id}`
    parameters['user'] = auth.id

    return await queryOne<Post>({ sql, parameters })
})