import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, votes, type, tokens, time, url
            FROM $image
            FETCH user
        `)
        .addRecord("image", `image:${id}`)
        .queryOne<Image>()
})