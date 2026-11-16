import type { Pin } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { attachPinModeration } from "@@/server/utils/pinModeration"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const viewer = await authenticateOptionalRequest(event)
    const excluded = await UserSettingsManager.getFilteredTargets(viewer)
    const pins = await new DatabaseQuery()
        .addSql(`
            RETURN SELECT id,
                item.{ id, user, title, content, tags, time, visits, score, votes, replyTo, topics, comments, images, status, edited, timeEdited, moderation,
                    description, url, preview, quote, quotes, replies, ancestors, chain, deleted } AS item,
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 512) ELSE item.content END AS item.content,
                scope, topic, user, active, time
            FROM pin
            WHERE active = true
            AND scope = "app"
            AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([item.user], item.topics ?? []))
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .addRecords("excluded", excluded)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})