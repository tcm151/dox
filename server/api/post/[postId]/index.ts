import { Post } from "~/types/types";
import { queryOne, queryAll } from "../../../database";

export default defineEventHandler(async (event) => {
    const { postId } = event.context.params!;
    return {
        post: await queryOne<Post>([`
            SELECT id, title, content, topics, time, votes, edited, timeEdited, user.id, user.name
            FROM post
            WHERE id = post:${postId}
            FETCH user
        `]),
        comments: await queryAll<Comment>([`
            SELECT id, time, user.id, user.name, post.id, replyTo, content, votes, edited, timeEdited
            FROM comment
            WHERE post.id = post:${postId}
            FETCH user, post
        `])
    }
})