import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, title, content, topics, time, votes, edited, timeEdited, user.id, user.name, visits')
    sql.push('FROM $post')
    sql.push('FETCH user')
    parameters['post'] = `post:${postId}`
    
    return await queryOne<Post>({ sql, parameters })
})