import { Validator } from "@@/shared/utils/Validator"

interface UpdateTopicPinRequest {
    active: boolean
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic, id } = event.context.params!
    const body = await readBody<UpdateTopicPinRequest>(event)
    
    new Validator("TopicPin")
        .boolean(body.active, "active")
        .confirm()

    await new DatabaseQuery()
        .addSql(`
            IF !record::exists($topic) {
                fn::http(404, "Topic not found.");
            };
            IF NOT ($user.roles CONTAINS "admin" OR $topic.moderators CONTAINS $user) {
                fn::http(403, "You cannot manage pins for this topic.");
            };
            LET $pinRecord = (
                SELECT VALUE id FROM ONLY pin
                WHERE id = $pin AND scope = "topic" AND topic = $topic
                LIMIT 1
            );
            IF $pinRecord = NONE {
                fn::http(404, "Topic pin not found.");
            };
            UPDATE $pinRecord SET active = $active;
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("pin", `pin:${id}`)
        .addRecord("user", auth.id)
        .addParameter("active", body.active)
        .execute()

    return body.active
})