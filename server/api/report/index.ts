export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT id, reporter.id, subject.id, time')
    sql.push('FROM report')
    sql.push('WHERE reporter.id AND subject.id')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH reporter, subject')
    return await queryAll<{ subject: string, reporter: string, time?: string }>({ sql })
})