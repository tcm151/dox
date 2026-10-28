import type { Thread } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            IF $thread.status NOT IN ["active", "archived"] {
                fn::http(409, "This thread cannot be archived in its current state.");
            };
            UPDATE $thread SET
                status = IF status = "archived" THEN "active" ELSE "archived" END
        `)
        .addRecord("thread", `thread:${id}`)
        .queryOne<Thread>()
})