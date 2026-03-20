import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $feedback SET
            dismissed = true
        `)
        .addRecordId("feedback", `feedback:${id}`)
        .queryOne<Feedback>()
})