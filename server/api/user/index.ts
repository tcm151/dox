import type { User } from "~/types"

export default defineEventHandler(async (event) => {
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, name, link, description, dateJoined, votes, followers, following, topics,')
    sql.push('roles, traits')
    sql.push('FROM user')
    sql.push('ORDER BY dateJoined DESC')
    return await queryAll<User>({ sql, parameters })
})