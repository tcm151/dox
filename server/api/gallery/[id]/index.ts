import type { Gallery } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, description, time, topics,
                images.{id, url} AS images, votes, score, visits, archived
            FROM $gallery
            FETCH user
        `)
        .addRecord("gallery", `gallery:${id}`)
        .queryOne<Gallery>()
})