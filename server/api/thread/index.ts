import type { Thread } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"

export default defineEventHandler(async (event) => {
    await SettingsManager.canViewFeed("threads")

    let query = getQuery<{ sortBy: string, page: number, pageSize: number }>(event)
    
    const threads = await new DatabaseQuery()
        .addSql(`
            SELECT id, user.{id, name, roles}, content, tags, time,
            topics, quote.{id, content, tags, time, replies, topics, votes, visits, status, user.{id, name, roles}}, replies, votes, score,
            edited, timeEdited, visits, images.{id, url},
            (SELECT locked, slowed FROM ONLY moderation WHERE subject = $parent.id LIMIT 1) AS moderation
            FROM thread
            WHERE replyTo = NONE
            AND status = "active"
            ORDER BY time DESC
        `)
        .queryAll<Thread>()

    return sortList(threads, query.sortBy)
})