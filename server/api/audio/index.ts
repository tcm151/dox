import type { Audio } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, votes, type, tokens, time, url
            FROM audio
            ORDER BY time DESC
        `)
        .queryAll<Audio>()
})