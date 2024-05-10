import type { User } from "~/types";

export default defineEventHandler(async (event) => {
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, name, link, description, dateCreated, votes, followers, following, topics')
    sql.push('FROM user')
    sql.push('ORDER BY dateCreated DESC')
    return await queryAll<User>({ sql, parameters })
})