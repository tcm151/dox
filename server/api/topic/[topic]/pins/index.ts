import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT id,
                item.{ id, user.{id, name, roles}, title, content, tags, time, visits, score, votes,
                    replyTo.{id, title, tags}, topics, comments, images.{id, url}, status, edited, timeEdited, moderation,
                    description, url, preview, quote.{id, content, tags, time, replies, topics, votes, visits, status, user.{id, name, roles}},
                    quotes, replies, ancestors, chain, deleted },
                IF record::tb(item) = "post" THEN string::slice(item.content ?? "", 0, 1024) ELSE item.content END AS item.content,
                scope, topic.{id}, user.{id, name, roles}, active, time
            FROM pin
            WHERE scope = "topic"
            AND topic = $topic
            AND active = true
            AND record::exists(item) AND item.status = "active"
            ORDER BY time DESC
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})