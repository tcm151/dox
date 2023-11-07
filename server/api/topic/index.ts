import type { Topic } from "~/types";

export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM topic')
    sql.push('ORDER BY votes.score DESC')
    return await queryAll<Topic>({ sql })
})