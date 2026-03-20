export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $draft.user != $user.id {
                THROW "You are not allowed to do this.";
            };

            DELETE $draft;
            RETURN true;
        `)
        .addRecord("draft", `draft:${id}`)
        .addParameter("user", auth)
        .queryAll<boolean>()
})