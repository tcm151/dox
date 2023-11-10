import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    var { sql } = queryBuilder()
    
    sql.push('SELECT id, active, time,')
    sql.push('user.id, user.name,')
    sql.push('post.id, post.user.id, post.user.name, post.title, post.time,')
    sql.push('post.replyTo.id, post.replyTo.title, post.topics, post.comments, post.votes,')
    sql.push('post.images')
    sql.push('FROM pin')
    sql.push('FETCH user, post, post.images;')
    
    return await queryAll<Pin>({ sql })
})