import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                LET $pins = (
                    SELECT VALUE post FROM pin
                    WHERE active = true
                    FETCH post
                );

                RETURN SELECT id, user.id, user.name, title, time,
                replyTo.id, replyTo.title, topics, comments, votes, visits,
                images
                FROM $pins
                FETCH user, replyTo, images;
            };
        `)
        .queryAll<Post>()
})