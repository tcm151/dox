export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!
    
    let { sql, parameters } = queryBuilder()

    sql.push('IF $draft.user != $user.id {')
    sql.push('THROW "You are not allowed to do this.";')
    sql.push('};')

    sql.push('DELETE $draft;')
    sql.push('RETURN true;')

    parameters['draft'] = `draft:${id}`
    parameters['user'] = auth

    return await queryAll<boolean>({ sql, parameters })
})