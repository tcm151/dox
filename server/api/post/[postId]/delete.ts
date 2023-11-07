import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { postId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $post')
    sql.push('FETCH images')
    parameters['post'] = `post:${postId}`
    let post = await queryOne<Post>({ sql, parameters })

    
    if (post.user === auth.id || auth.admin) {
        var { sql, parameters } = queryBuilder()
        parameters['post'] = `post:${postId}`

        post.topics.forEach((topic, i) => {
            sql.push(`UPDATE $topic${i}`)
            sql.push('SET posts -= $post;')
            parameters[`topic${i}`] = topic
        })
        
        parameters['user'] = post.user
        post.images?.forEach((image, i) => {
            if (image.user === post.user) {
                sql.push(`UPDATE $user SET`)
                sql.push(`tokens += $tokens${i};`)
                parameters[`tokens${i}`] = image.tokens
                
                sql.push(`DELETE $image${i};`)
                parameters[`image${i}`] = image.id
            }
        })

        sql.push(`DELETE $post;`)
        return await multiQuery({ sql, parameters })
    }
})