import type { Comment, Gallery } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const query = getQuery<{ sortBy: string }>(event)
    const { id } = event.context.params!

    const gallery = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, title, description, tags, time, topics,
                images.{id, url}, votes, score, visits, status, moderation,
                (
                    SELECT id, time, user.{id, name, roles}, context,
                        replyTo, content, votes, score, edited, deleted, status, timeEdited, moderation
                    FROM $gallery.comments
                    ORDER BY time DESC
                ) AS comments
            FROM $gallery
        `)
        .addRecord("gallery", `gallery:${id}`)
        .queryOne<Gallery>()

    gallery.comments = sortList(gallery.comments as Comment[], query.sortBy) as (Comment & string)[]
    return gallery
})