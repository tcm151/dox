import { SettingsManager } from "@@/server/utils/SettingsManager"
import { ModerationManager } from "@@/server/utils/ModerationManager"

interface ApprovalResult {
    approved: boolean
    user: string
    topic: string
}

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id } = event.context.params!
    const settings = await SettingsManager.get()

    const result = await new DatabaseQuery()
        .addSql(`
            IF $request.closed {
                fn::http(409, "This request has already been closed.");
            };
            IF $request.approvals CONTAINS $user {
                fn::http(409, "You have already approved this request.");
            };
            IF $request.user = $user AND $user.roles CONTAINSNOT "admin" {
                fn::http(403, "You cannot approve your own request.");
            };

            LET $request = (
                UPDATE ONLY $request SET
                    approvals += $user
            );

            LET $approved = array::len($request.approvals) >= $threshold
                AND array::len($request.approvals) > array::len($request.denials);

            IF $approved {
                UPDATE $request.topic SET
                moderators = array::union(moderators, [$request.user]);
                UPDATE $request.user SET
                    roles = array::union(roles, ["moderator"]);
                UPDATE $request SET
                    closed = true;
            };

            RETURN {
                approved: $approved,
                user: $request.user,
                topic: $request.topic
            };
        `)
        .addTransaction()
        .addRecord("request", `moderationRequest:${id}`)
        .addRecord("user", auth.id)
        .addParameter("threshold", settings.moderation.threshold)
        .queryValue<ApprovalResult>()

    if (result.approved) {
        await ModerationManager.sendApprovalNotification(result)
    }

    return result
})