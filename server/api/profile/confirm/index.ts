export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = await readBody<{ id: string }>(event)

    let { sql, parameters } = queryBuilder()

    sql.push('RETURN {')
    
    sql.push('IF $confirmation.user != $user.id {')
    sql.push('THROW "You are not allowed to do this.";')
    sql.push('};')

    sql.push('IF $confirmation.expired {')
    sql.push('THROW "Confirmation period has expired, please try again and complete within 15 minutes."')
    sql.push('};')

    sql.push('IF $confirmation.used {')
    sql.push('THROW "This confirmation has already been used.";')
    sql.push('};')

    sql.push('UPDATE $user SET')
    sql.push('confirmed = true;')
    sql.push('UPDATE $confirmation SET')
    sql.push('used = true;')
    
    sql.push('RETURN $user.confirmed;')

    sql.push('};')

    parameters['confirmation'] = id
    parameters['user'] = auth

    return await queryOne<boolean>({ sql, parameters })
})
