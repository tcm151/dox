import type { Post, Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const { text } = getQuery(event)

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
                LET $posts = (
                    SELECT id, user.id, user.name, title, time, edited, timeEdited,
                        replyTo.id, replyTo.title, topics, comments, votes,
                        archived, images, visits,
                        (search::score(1) + search::score(2)) AS search.score
                    FROM post
                    WHERE (title @1@ $text OR content @2@ $text)
                    AND archived != true
                    ORDER BY search.score DESC
                    FETCH user, replyTo, images
                );

                LET $threads = (
                    SELECT id, user.id, user.name, content, time,
                        topics, replies, votes, score,
                        edited, timeEdited, visits, images,
                        search::score(1) AS search.score
                    FROM thread
                    WHERE content @1@ $text
                    ORDER BY search.score DESC
                    FETCH user, replyTo, images
                );

                RETURN SELECT * FROM $posts, $threads;
            }
        `)
        .addParameter("text", text)
        .queryAll<Post | Thread>()
})