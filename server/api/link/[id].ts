import type { Comment, Link } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const query = getQuery<{ sortBy: string }>(event)
    const { id } = event.context.params!

    const link = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, description, url, preview, tags, time, topics,
                votes, score, status, edited, timeEdited, visits, moderation,
                (
                    SELECT id, time, user.id, user.name, context,
                        replyTo, content, votes, score, edited, deleted, status, timeEdited, moderation
                    FROM $link.comments
                    ORDER BY time DESC
                    FETCH user
                ) AS comments
            FROM $link
            FETCH user
        `)
        .addRecord("link", `link:${id}`)
        .queryOne<Link>()

    link.comments = sortList(link.comments as Comment[], query.sortBy) as (Comment & string)[]
    return link
})