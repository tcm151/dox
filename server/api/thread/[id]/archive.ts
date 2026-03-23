import type { Thread } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $thread SET
                archived = !archived
        `)
        .addRecord("thread", `thread:${id}`)
        .queryOne<Thread>()
})