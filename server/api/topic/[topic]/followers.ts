export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT count(topics CONTAINS $topic)')
    sql.push('FROM user')
    sql.push('GROUP ALL')
    parameters['topic'] = `topic:${topic}`
    return await queryOne<{ count: number }>({ sql, parameters })
})