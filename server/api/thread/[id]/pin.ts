import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])    
    
    const { id } = event.context.params!

        return await new DatabaseQuery()
            .addSql(`
                CREATE pin SET
                    item = $thread,
                    user = $user;
            `)
            .addRecord("thread", `thread:${id}`)
            .addRecord("user", auth.id)
            .queryOne<Pin>()
})