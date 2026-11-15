import type { Link } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const query = getQuery<{ sortBy: string }>(event)

    const links = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, title, description, url, preview, tags, time, edited, timeEdited,
                topics, comments, votes, score, status, visits, moderation
            FROM link
            WHERE status = "active"
            ORDER BY time DESC
            FETCH user
        `)
        .queryAll<Link>()

    return sortList(links, query.sortBy)
})