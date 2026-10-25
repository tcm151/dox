export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id } = event.context.params!
    const settings = await SettingsManager.get()

    return await new DatabaseQuery()
        .addSql(`
            IF $request.closed {
                fn::http(409, "This request has already been closed.");
            };
            IF $request.approvals CONTAINS $user {
                fn::http(409, "You have already approved this request.");
            };
            IF $request.user = $user {
                fn::http(403, "You cannot approve your own request.");
            };

            LET $request = (
                UPDATE ONLY $request SET
                    approvals += $user
            );

            IF array::len($request.approvals) >= $threshold {
                UPDATE $request.topic SET
                    moderators += $request.user;

                IF $request.user.roles CONTAINSNOT "moderator" {
                    UPDATE $request.user SET
                        roles += "moderator";
                };

                UPDATE $request SET
                    closed = true;
            };
        `)
        .addTransaction()
        .addRecord("request", `moderationRequest:${id}`)
        .addRecord("user", auth.id)
        .addParameter("threshold", settings.moderation.threshold)
        .execute()
})