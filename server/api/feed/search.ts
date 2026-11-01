import type { SearchResult } from "@@/shared/types"

const MINIMUM_SEARCH_SCORE = 0.5

export default defineEventHandler(async (event) => {
    const { text } = getQuery(event)
    if (typeof text !== "string" || text.trim() === "") {
        return []
    }

    return await new DatabaseQuery()
        .addSql(`
            LET $comments = (
                SELECT id,
                    user.{id, name, roles} AS user,
                    context.{id, title, description} AS context, moderation,
                    content, time, edited, deleted, status, timeEdited, votes, score,
                    string::contains(string::lowercase(content), string::lowercase($text)) AS search.exact,
                    search::score(1) AS search.score
                FROM comment
                WHERE content @1@ $text
                AND deleted != true
                AND status = "active"
                AND context.status = "active"
                AND context.deleted != true
            );

            LET $posts = (
                SELECT id, user.id, user.name, title, time, edited, timeEdited,
                    replyTo.id, replyTo.title, topics, comments, votes,
                    status, images.{id, url} AS images, visits, moderation,
                    (string::contains(string::lowercase(title), string::lowercase($text))
                        OR string::contains(string::lowercase(content), string::lowercase($text))) AS search.exact,
                    (search::score(1) * 2 + search::score(2)) AS search.score
                FROM post
                WHERE (title @1@ $text OR content @2@ $text)
                AND status = "active"
                AND deleted != true
                FETCH user, replyTo
            );

            LET $threads = (
                SELECT id, user.id, user.name, content, time,
                    topics, replies, votes, score,
                    edited, timeEdited, visits, images.{id, url} AS images,
                    (SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation,
                    string::contains(string::lowercase(content), string::lowercase($text)) AS search.exact,
                    search::score(1) AS search.score
                FROM thread
                WHERE content @1@ $text
                AND status = "active"
                AND deleted != true
                FETCH user, replyTo
            );

            LET $galleries = (
                SELECT id, user.id, user.name, description, time,
                    topics, images.{id, url} AS images, votes, score, visits, status,
                    moderation,
                    string::contains(string::lowercase(description), string::lowercase($text)) AS search.exact,
                    search::score(1) AS search.score
                FROM gallery
                WHERE description @1@ $text
                AND status = "active"
                FETCH user
            );

            RETURN SELECT * FROM $posts, $threads, $galleries, $comments
                WHERE search.exact = true OR search.score >= $minimumScore
                ORDER BY search.exact DESC, search.score DESC, time DESC, id ASC;
        `)
        .addTransaction()
        .addParameter("text", text.trim())
        .addParameter("minimumScore", MINIMUM_SEARCH_SCORE)
        .queryAll<SearchResult>()
})