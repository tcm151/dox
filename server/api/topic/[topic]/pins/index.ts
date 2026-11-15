import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT id,
                item.{ id, user, title, content, tags, time, visits, score, votes, replyTo, topics, comments, images, status, edited, timeEdited, moderation,
                    description, url, preview, quote, quotes, replies, ancestors, chain, deleted } AS item,
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 512) ELSE item.content END AS item.content,
                scope, topic, user, active, time
            FROM pin
            WHERE scope = "topic"
            AND topic = $topic
            AND active = true
            AND record::exists(item) AND item.status = "active"
            ORDER BY time DESC
            FETCH user, topic, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})