import type { Post } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    const { sql, parameters } = queryBuilder()

    sql.push('RETURN {')
    
    sql.push('IF $post.user = $awarder {')
    sql.push('THROW "You cannot award your own posts...";')
    sql.push('};')
    
    sql.push('UPDATE $post SET')
    sql.push('votes.awards = array::union(votes.awards, [$awarder]);')
    parameters['post'] = `post:${id}`
    
    // TODO add event log for all token transactions
    sql.push('UPDATE $awarder SET')
    sql.push('tokens -= 256;')
    parameters['awarder'] = auth.id
    
    sql.push('UPDATE $post.user SET')
    sql.push('tokens += 256;')

    sql.push('CREATE notification SET')
    sql.push('recipient = $post.user,')
    sql.push('context = $post.id,')
    sql.push('message = $message;')
    parameters['message'] = [
        `**${auth.name}** awarded your post`,
        `> You gained 256 tokens. Don't forget to thank them!\n`,
    ].join('\n')
    
    sql.push('RETURN SELECT * FROM $post;')
    sql.push('};')

    return await queryOne<Post>({ sql, parameters })
})