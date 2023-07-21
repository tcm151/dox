export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $item SET')
    sql.push('votes.positive -= $user,')
    sql.push('votes.misleading -= $user,')
    sql.push('votes.negative -= $user')
    parameters['item'] = id
    parameters['user'] = auth.id

    return await queryOne({ sql, parameters })
})
