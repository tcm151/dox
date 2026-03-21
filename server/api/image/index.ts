import type { Image } from "~/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, votes, score,type, tokens, time, url
            FROM image
            WHERE public = true
            ORDER BY time DESC
            FETCH user
        `)
        .queryAll<Image>()
})