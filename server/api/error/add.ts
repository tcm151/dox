export default defineEventHandler(async (event) => {
    const error = await readBody(event)
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE error')
    sql.push('CONTENT $error')
    parameters['error'] = error
    return await queryOne<any>({ sql, parameters })
})