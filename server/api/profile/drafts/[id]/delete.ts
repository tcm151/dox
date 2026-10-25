export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $draft.user != $user {
                fn::http(403, "You are not allowed to do this.");
            }
            ELSE {
                DELETE $draft;
            };
        `)
        .addRecord("draft", `draft:${id}`)
        .addParameter("user", auth.id)
        .execute()

    return true
})