import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT id,
                item.{ id, user, title, content, tags, time, visits, score, votes, replyTo, topics, comments, images, status, edited, timeEdited, moderation,
                    description, url, preview, quote, quotes, replies, ancestors, chain, deleted } AS item,
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 512) ELSE item.content END AS item.content,
                scope, topic, user, active, time
            FROM pin
            WHERE active = true
            AND scope = "app"
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})