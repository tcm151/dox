import { Topic } from "~/types";

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $topic')
    parameters['topic'] = `topic:${topic}`
    return await queryOne<Topic>({ sql, parameters })
})