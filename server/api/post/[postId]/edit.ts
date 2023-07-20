import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const content = await readBody(event)
    const { postId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $post')
    parameters['post'] = `post:${postId}`
    let post = await queryOne<Post>({ sql, parameters })

    if (post.user === auth.id) {
        var { sql, parameters } = queryBuilder()
        sql.push('UPDATE $post SET')
        sql.push('content = $content,')
        sql.push('edited = true,')
        sql.push('timeEdited = time::now()')
        parameters['post'] = `post:${postId}`
        parameters['content'] = content
        return await queryOne<Post>({ sql, parameters })
    }
})