import type { Pin } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    
    sql.push('CREATE pin SET')
    sql.push('post = $post,')
    sql.push('user = $user;')

    parameters['post'] = `post:${id}`
    parameters['user'] = auth.id

    return await queryOne<Pin>({ sql, parameters })
})