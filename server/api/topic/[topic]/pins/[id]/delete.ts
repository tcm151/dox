export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { topic, id } = event.context.params!
    await new DatabaseQuery()
        .addSql(`
            IF !record::exists($topic) {
                fn::http(404, "Topic not found.");
            };
            IF NOT ($user.roles CONTAINS "admin" OR $topic.moderators CONTAINS $user) {
                fn::http(403, "You cannot manage pins for this topic.");
            };
            LET $pinRecord = (SELECT VALUE id FROM ONLY pin
                WHERE id = $pin AND scope = "topic" AND topic = $topic LIMIT 1);
            IF $pinRecord = NONE {
                fn::http(404, "Topic pin not found.");
            };
            DELETE $pinRecord;
        `)
        .addTransaction()
        .addRecord("topic", `topic:${topic}`)
        .addRecord("pin", `pin:${id}`)
        .addRecord("user", auth.id)
        .execute()

    return true
})