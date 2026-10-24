import type { Gallery } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, ["admin", "developer"])

    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            UPDATE $gallery SET archived = !archived
        `)
        .addRecord("gallery", `gallery:${id}`)
        .queryOne<Gallery>()
})