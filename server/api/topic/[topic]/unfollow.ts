export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { topic } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $user SET')
    sql.push('topics -= $topic')
    parameters['user'] = auth.id
    parameters['topic'] = `topic:${topic}`

    return await queryOne({ sql, parameters })
})