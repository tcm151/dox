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
                item.{ id, user.{id, name, roles}, title, content, tags, time, visits, score, votes,
                    replyTo.{id, title, tags}, topics, comments, images.{id, url}, status, edited, timeEdited, moderation,
                    description, url, preview, quote.{id, content, tags, time, replies, topics, votes, visits, status, user.{id, name, roles}},
                    quotes, replies, ancestors, chain, deleted },
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 512) ELSE item.content END AS item.content,
                scope, topic, user.{id, name, roles}, active, time
            FROM pin
            WHERE active = true
            AND scope = "app"
            AND ($excluded.len() = 0 OR $excluded CONTAINSNONE array::union([item.user], item.topics ?? []))
        `)
        .addRecords("excluded", excluded)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})