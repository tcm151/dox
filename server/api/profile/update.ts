import type { User } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const user = await readBody<User>(event)
    
    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $user SET')
    sql.push('link = $link,')
    sql.push('description = $description')
    
    parameters['user'] = auth.id
    parameters['link'] = user.link
    parameters['description'] = user.description
    
    return await queryOne<User>({ sql, parameters })
})