import type { Gallery } from "@@/shared/types"

export default defineEventHandler(async () => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, description, time, topics,
                images.{id, url} AS images, votes, score, visits, status
            FROM gallery
            WHERE status = "active"
            ORDER BY time DESC
            FETCH user
        `)
        .queryAll<Gallery>()
})