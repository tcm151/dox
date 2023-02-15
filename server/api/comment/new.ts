import { Post, Comment, Notification } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    let comment = await readBody(event);
    const auth = await authenticateRequest(event);
    
    // overwrite user with auth
    comment.user = auth.id;
    comment.votes.positive = [auth.id]
    comment = await queryOne<Comment>([
        `CREATE comment CONTENT ${JSON.stringify(comment)}`
    ])
    
    // get the reply to context
    let replyTo = await queryOne<Post | Comment>([
        `SELECT id, user.id, user.name`,
        `FROM ${comment.replyTo}`,
        `FETCH user`,
    ])
    
    // send a notification to relevant user
    let notification = await queryOne<Notification>([
        `CREATE notification SET`,
        `recipient = ${replyTo.user.id},`,
        `context = ${replyTo.id},`,
        `message = "${comment.user} responed to ${replyTo.id}",`,
        `time = time::now(),`,
        `viewed = false`,
    ])
    
    return { comment, notification }
})