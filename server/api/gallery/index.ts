import type { Gallery } from "@@/shared/types"

export default defineEventHandler(async () => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, title, description, tags, time, topics,
                images.{id, url}, votes, score, visits, status, moderation
            FROM gallery
            WHERE status = "active"
            ORDER BY time DESC
        `)
        .queryAll<Gallery>()
})