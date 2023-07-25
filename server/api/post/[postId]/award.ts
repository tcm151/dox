import { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { postId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT * FROM $post')
    parameters['post'] = `post:${postId}`
    const post = await queryOne<Post>({ sql, parameters })

    if (post.user == auth.id) {
        throw createError({
            statusCode: 400,
            message: "You cannot award your own posts..."
        })
    }

    var { sql, parameters } = queryBuilder()
    sql.push('UPDATE $post SET')
    sql.push('votes.awards = array::union(votes.awards, [$awarder]);')
    sql.push('UPDATE $awarder SET')
    sql.push('tokens -= 64;')
    sql.push('UPDATE $recipient SET')
    sql.push('tokens += 64;')
    parameters['post'] = post.id
    parameters['awarder'] = auth.id
    parameters['recipient'] = post.user
    return await multiQuery({ sql, parameters })
})