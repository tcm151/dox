import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM post')
    sql.push('WHERE topics CONTAINS $topic')
    sql.push('FETCH user')
    parameters['topic'] = `topic:${topic}`
    return await queryAll<Post>({ sql, parameters })
})