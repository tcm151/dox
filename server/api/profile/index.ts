import type { User } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    
    if (!auth) {
        throw createError({
            statusCode: 400,
            statusMessage: "User does not exist."
        })
    }
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, name, email, link, description, dateCreated,')
    sql.push('followers, following, topics,')
    sql.push('confirmed, verified, admin, tokens')
    sql.push('FROM $user')
    parameters['user'] = auth.id
    return await queryOne<User>({ sql, parameters })
})