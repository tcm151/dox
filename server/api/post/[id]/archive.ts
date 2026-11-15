export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")
    
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            IF $post.status NOT IN ["active", "archived"] {
                fn::http(409, "This post cannot be archived in its current state.");
            };
            UPDATE $post SET
                status = IF status = "archived" THEN "active" ELSE "archived" END
        `)
        .addTransaction()
        .addRecord("post", `post:${id}`)
        .execute()

    return true
})