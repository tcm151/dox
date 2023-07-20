export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM report')
    sql.push('//FETCH subject, reporter')
    sql.push('ORDER BY time DESC')
    return await queryAll<{ subject: string, reporter: string, time?: string }>({ sql })
})