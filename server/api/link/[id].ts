import type { Link } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const query = getQuery<{ sortBy: string }>(event)
    const { id } = event.context.params!

    const link = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, title, description, url, preview, tags, time, topics,
                votes, score, status, edited, timeEdited, visits, moderation,
                (
                    SELECT id, time, user.{id, name, roles}, context,
                        replyTo, content, votes, score, edited, deleted, status, timeEdited, moderation
                    FROM $link.comments
                    ORDER BY time DESC
                ) AS comments
            FROM $link
        `)
        .addRecord("link", `link:${id}`)
        .queryOne<Link>()

    link.comments = sortList(link.comments, query.sortBy)
    return link
})