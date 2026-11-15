export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $link.status NOT IN ["active", "archived"] {
                fn::http(409, "This link cannot be archived in its current state.");
            };
            UPDATE $link SET status = IF status = "archived" THEN "active" ELSE "archived" END
        `)
        .addTransaction()
        .addRecord("link", `link:${id}`)
        .execute()

    return true
})