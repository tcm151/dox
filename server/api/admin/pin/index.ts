import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT id,
                item.{ id, user, title, content, tags, time, visits, score, votes, replyTo, topics, comments, images, status, edited, timeEdited, moderation,
                    description, url, preview, quote, quotes, replies, ancestors, chain, deleted } AS item,
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 512) ELSE item.content END AS item.content,
                scope, topic, user, active, time
            FROM pin
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .queryAll<Pin>()

    // TODO remove this and just do everything in one query
    return await attachPinModeration(pins)
})