import { Post, Comment, Notification, User } from "~/types";
import { queryOne } from "../../database";

export default defineEventHandler(async (event) => {
    let comment = await readBody(event);
    const auth = await authenticateRequest(event);
    
    // overwrite user with auth
    comment.user = auth.id;
    comment.votes.positive = [auth.id]
    comment = await queryOne<Comment>([`
        CREATE comment
        CONTENT ${JSON.stringify(comment)}
    `])
    
    // get the reply to context
    let replyTo = await queryOne<Post & Comment>([`
        SELECT id, title, content, post.id, user.id, user.name
        FROM ${comment.replyTo}
        FETCH post, user
    `])

    const context = (replyTo.id.startsWith('post')) ?
        replyTo.id : (replyTo.post as Post).id
    
    // send a notification to relevant user
    // TODO need to account for when directly responding to posts
    let notification = await queryOne<Notification>([`
        CREATE notification SET
        recipient = ${(replyTo.user as User).id},
        context = ${context},
        message = "${[
            `**u/${auth.name}** replied to you`,
            `> ${comment.content}\n`,
        ].join("\n")}",
        time = time::now(),
        viewed = false
    `])
    
    return { comment, notification }
})