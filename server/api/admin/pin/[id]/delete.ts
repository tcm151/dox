import type { Pin } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])
    
    const { id } = event.context.params!

    await new DatabaseQuery()
        .addSql(`
            DELETE $pin
        `)
        .addRecord("pin", `pin:${id}`)
        .queryOne<Pin>()

    return true
})