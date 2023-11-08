import type { Comment } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    let comment = await readBody(event)
    comment.user = auth.id;
    comment.votes.positive = [auth.id]
    
    const { sql, parameters } = queryBuilder()

    sql.push('RETURN {')
    
    sql.push('LET $comment = (CREATE comment CONTENT $comment);')
    parameters['comment'] = comment

    // send a notification to relevant user
    // REFACTOR need to account for when directly responding to posts
    sql.push('CREATE notification SET')
    sql.push('recipient = $comment.replyTo.user,')
    sql.push('context = $comment.replyTo,')
    sql.push('message = $message;')
    parameters['message'] = [
        `**${auth.name}** replied to you`,
        `> ${comment.content}\n`,
    ].join('\n')

    sql.push('RETURN $comment;')
    sql.push('};')

    await queryOne<Comment>({ sql, parameters })
})