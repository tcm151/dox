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
    parameters['post'] = post.id
    
    sql.push('UPDATE $awarder SET')
    sql.push('tokens -= 256;')
    parameters['awarder'] = auth.id
    
    sql.push('UPDATE $recipient SET')
    sql.push('tokens += 256;')
    parameters['recipient'] = post.user

    sql.push('CREATE notification SET')
    sql.push('recipient = $recipient,')
    sql.push('context = $context,')
    sql.push('message = $message,')
    sql.push('time = time::now(),')
    sql.push('viewed = false;')
    parameters['recipient'] = post.user
    parameters['context'] = post.id
    parameters['message'] = [
        `**${auth.name}** awarded your post`,
        `> You gained 256 tokens. Don't forget to thank them!\n`,
    ].join('\n')

    return await multiQuery({ sql, parameters })
})