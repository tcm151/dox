export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    sql.push('SELECT count(), topic')
    
    sql.push('FROM (')
    sql.push('SELECT id, topics AS topic')
    sql.push('FROM post')
    sql.push('WHERE time > time::now() -3mo')
    sql.push('SPLIT topic')
    sql.push(')')
    
    sql.push('GROUP BY topic')
    sql.push('ORDER BY count DESC')
    sql.push('LIMIT 5')
    return await queryAll<{ count: number, topic: string }>({ sql })
})