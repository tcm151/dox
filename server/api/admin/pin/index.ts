import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT id,
                item.{ id, user.{id, name, roles}, title, content, tags, time, visits, score, votes,
                    replyTo.{id, title, tags}, topics, comments, images.{id, url}, status, edited, timeEdited, moderation,
                    description, url, preview, quote.{id, content, tags, time, replies, topics, votes, visits, status, user.{id, name, roles}},
                    quotes, replies, ancestors, chain, deleted },
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 512) ELSE item.content END AS item.content,
                scope, topic, user.{id, name, roles}, active, time
            FROM pin
        `)
        .queryAll<Pin>()

    // TODO remove this and just do everything in one query
    return await attachPinModeration(pins)
})