import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id, topic } = event.context.params!
    const body = await readBody<{ status: Report["status"], resolution?: string }>(event)

    return await new DatabaseQuery()
        .addSql(`
            IF NOT ($topic.moderators CONTAINS $user OR $user.roles CONTAINS "admin") {
                fn::http(403, "You cannot moderate this topic.");
            };
            IF NOT ($report.subject.topics CONTAINS $topic) {
                fn::http(404, "This report is not part of this topic.");
            };
            IF NOT ($status IN ["pending", "resolved", "removed"]) {
                fn::http(400, "Invalid report status.");
            };
            IF $resolution != NONE AND string::len($resolution) < 3 {
                fn::http(400, "Must provide a report resolution note.");
            };

            RETURN UPDATE $report SET
                status = $status,
                resolution = $resolution
            ;
        `)
        .addTransaction()
        .addRecord("report", `report:${id}`)
        .addRecord("topic", `topic:${topic}`)
        .addRecord("user", auth.id)
        .addParameter("status", body.status)
        .addParameter("resolution", body.resolution)
        .queryValue<Report[]>()
})