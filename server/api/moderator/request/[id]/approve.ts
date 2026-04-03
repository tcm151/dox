export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["moderator", "admin"])

    const { id } = event.context.params!
    const settings = await SettingsManager.get()

    return await new DatabaseQuery()
        .addSql(`
            RETURN {
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
            };
        `)
        .addRecord("request", `moderationRequest:${id}`)
        .addRecord("user", auth.id)
        .addParameter("threshold", settings.moderation.threshold)
        .execute()
})