import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic } = event.context.params!
    const pins = await new DatabaseQuery()
        .addSql(`
            IF !record::exists($topic) {
                fn::http(404, "Topic not found.");
            };
            IF NOT ($user.roles CONTAINS "admin" OR $topic.moderators CONTAINS $user) {
                fn::http(403, "You cannot manage pins for this topic.");
            };
            SELECT *
            FROM pin
            WHERE scope = "topic" AND topic = $topic
            AND record::exists(item) AND item.status = "active"
            ORDER BY time DESC
            FETCH user, topic, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})