import { Post, Comment, Notification } from "~/types/types";
import { authenticateRequest, queryOne } from "../../database";

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
    let replyTo = await queryOne<Post | Comment>([`
        SELECT id, content, post, user.id, user.name
        FROM ${comment.replyTo}
        FETCH post, user
    `])
    
    // send a notification to relevant user
    // TODO need to account for when directly responding to posts
    // TODO this does not look very pretty, and is hard to understand
    let notification = await queryOne<Notification>([`
        CREATE notification SET
        recipient = ${replyTo.user.id},
        context = ${replyTo.id},
        message = "${[
            `**u/${auth.name}** responded`,
            `> ${comment.content}\n`,
            `to your comment`,
            `> ${replyTo.content}\n`,
            // `on the post **${replyTo.post.}**`,
        ].join("\n")}",
        time = time::now(),
        viewed = false
    `])
    
    return { comment, notification }
})