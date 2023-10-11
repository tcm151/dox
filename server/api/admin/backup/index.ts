export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    if (!auth.admin) {
        throw createError({
            statusCode: 401,
            message: "You shall not pass!"
        })
    }

    const { sql } = queryBuilder()

    sql.push('LET $environment = $session.db;')
    sql.push('USE NS dox DB backup;')
    sql.push('SELECT id, time, user.id, user.name')
    sql.push('FROM backup')
    sql.push('WHERE environment = $environment')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user;')

    return (await multiQuery({ sql }))[2].result
})