export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $gallery.status NOT IN ["active", "archived"] {
                fn::http(409, "This gallery cannot be archived in its current state.");
            };
            UPDATE $gallery SET status = IF status = "archived" THEN "active" ELSE "archived" END
        `)
        .addTransaction()
        .addRecord("gallery", `gallery:${id}`)
        .execute()

    return true
})