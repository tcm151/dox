import { Comment } from "~/types";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, time, user.id, user.name, post.id, replyTo, content, votes, edited, timeEdited')
    sql.push('FROM comment')
    sql.push('WHERE post.id = $post')
    sql.push('ORDER BY time DESC')
    sql.push('FETCH user, post')
    parameters['post'] = `post:${postId}`
    return await queryAll<Comment>({ sql, parameters })
})