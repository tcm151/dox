export default defineEventHandler(async (event) => {
    const { id } = await readBody<{ id: string }>(event)

    let { sql, parameters } = queryBuilder()

    sql.push('RETURN {')
    
    sql.push('IF $confirmation.expired {')
    sql.push('THROW "Confirmation period has expired, please try again and complete within 15 minutes."')
    sql.push('};')

    sql.push('IF $confirmation.used {')
    sql.push('THROW "This confirmation has already been used.";')
    sql.push('};')

    sql.push('UPDATE $confirmation.user SET')
    sql.push('traits = array::union(traits, ["confirmed"]);')
    sql.push('UPDATE $confirmation SET')
    sql.push('used = true;')
    
    sql.push('RETURN $confirmation.user.traits;')

    sql.push('};')

    parameters['confirmation'] = id

    return await queryOne<boolean>({ sql, parameters })
})
