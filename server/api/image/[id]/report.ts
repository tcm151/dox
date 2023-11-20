import type { Image } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE report SET')
    sql.push('subject = $image,')
    sql.push('reporter = $user,')
    sql.push('time = time::now()')
    parameters['image'] = `image:${id}`
    parameters['user'] = auth.id
    
    return await queryOne<Image>({ sql, parameters })
})