import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, votes, type, tokens, time, url, description
            FROM $image
        `)
        .addRecord("image", `image:${id}`)
        .queryOne<Image>()
})