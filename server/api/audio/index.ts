import type { Audio } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"

export default defineEventHandler(async (event) => {
    await SettingsManager.canViewFeed("audio")

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, votes, type, tokens, time, url
            FROM audio
            ORDER BY time DESC
        `)
        .queryAll<Audio>()
})