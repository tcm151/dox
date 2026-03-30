import type { Image } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.id, user.name, votes, score, type, tokens, time, url, visits
            FROM image
            WHERE public = true
            ORDER BY time DESC
            FETCH user
        `)
        .queryAll<Image>()
})