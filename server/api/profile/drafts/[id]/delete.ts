export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $draft.user != $user {
                THROW "You are not allowed to do this.";
            };
            DELETE $draft;
        `)
        .addRecord("draft", `draft:${id}`)
        .addParameter("user", auth.id)
        .execute()

    return true
})