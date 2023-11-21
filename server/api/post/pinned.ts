import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    var { sql, parameters } = queryBuilder()
    
    sql.push('RETURN {')
    
    sql.push('LET $pins = (')
    sql.push('SELECT VALUE post FROM pin')
    sql.push('WHERE active = true')
    sql.push('FETCH post')
    sql.push(');')
    
    sql.push('RETURN SELECT id, user.id, user.name, title, time,')
    sql.push('replyTo.id, replyTo.title, topics, comments, votes,')
    sql.push('images')
    sql.push('FROM $pins')
    sql.push('FETCH user, replyTo, images;')

    sql.push('};')

    return await queryAll<Post>({ sql, parameters })
})