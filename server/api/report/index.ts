export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM report')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH reporter, subject')
    return await queryAll<{ subject: string, reporter: string, time?: string }>({ sql })
})