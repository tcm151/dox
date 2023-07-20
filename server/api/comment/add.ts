import { Post, Comment, Notification, User } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let comment = await readBody(event)
    comment.user = auth.id;
    comment.votes.positive = [auth.id]
    
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE comment')
    sql.push('CONTENT $comment')
    parameters['comment'] = comment
    comment = await queryOne<Comment>({ sql, parameters })
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT id, title, content, post.id, user.id, user.name')
    sql.push('FROM $comment.replyTo')
    sql.push('FETCH post, user')
    parameters['comment'] = comment
    let replyTo = await queryOne<Post & Comment>({ sql, parameters })

    // get context based on reply to is post or comment
    const context = (replyTo.id.startsWith('post')) ?
        replyTo.id : (replyTo.post as Post).id
    
    // send a notification to relevant user
    // FIXME need to account for when directly responding to posts
    var { sql, parameters } = queryBuilder()
    sql.push('CREATE notification SET')
    sql.push('recipient = $recipient,')
    sql.push('context = $context,')
    sql.push('message = $message,')
    sql.push('time = time::now(),')
    sql.push('viewed = false')
    parameters['recipient'] = (replyTo.user as User).id
    parameters['context'] = context
    parameters['message'] = [
        `**u/${auth.name}** replied to you`,
        `> ${comment.content}\n`,
    ].join('\n')
    let notification = await queryOne<Notification>({ sql, parameters })
    
    return { comment, notification }
})