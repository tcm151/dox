import type { Pin } from "@@/shared/types"
import { parseRecordId } from "@@/shared/utils/records"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic } = event.context.params!
    const body = await readBody<{ item?: string }>(event)
    const itemId = typeof body?.item === "string" ? body.item : undefined
    const item = itemId ? parseRecordId(itemId) : undefined
    if (!itemId || !item || !["post", "thread", "gallery", "link"].includes(item.table)) {
        throw createError({ statusCode: 400, statusMessage: "A post, thread, gallery, or link record is required." })
    }

    await new DatabaseQuery()
        .addSql(`
            IF !record::exists($topic) {
                fn::http(404, "Topic not found.");
            };
            IF NOT ($user.roles CONTAINS "admin" OR $topic.moderators CONTAINS $user) {
                fn::http(403, "You cannot manage pins for this topic.");
            };
            IF !record::exists($item) {
                fn::http(404, "Content not found.");
            };
            IF $item.status != "active" OR !($item.topics CONTAINS $topic) OR (record::tb($item) = "thread" AND $item.replyTo != NONE) {
                fn::http(400, "Only active top-level content in this topic can be pinned.");
            };

            LET $existing = (
                SELECT VALUE id
                FROM pin
                WHERE item = $item
                AND scope = "topic"
                AND topic = $topic
                LIMIT 1
            );
            IF $existing.len() > 0 {
                fn::http(409, "This content is already pinned for this topic.");
            };

            CREATE pin SET
                item = $item,
                scope = "topic",
                topic = $topic,
                user = $user,
                active = true;
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("item", itemId)
        .addRecord("user", auth.id)
        .execute()

    return true
})