import type { User } from "~/types"

// REFACTOR to new query standards
export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, name, link, description, dateJoined, votes, followers, following, topics')
    sql.push('FROM $user')
    parameters['user'] = `user:${id}`
    return await queryOne<User>({ sql, parameters })
})