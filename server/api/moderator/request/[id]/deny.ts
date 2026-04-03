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
                        denials += $user
                );
    
                IF array::len($request.denials) >= $threshold {
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