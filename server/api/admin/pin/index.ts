import type { Pin } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM pin
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images;
        `)
        .queryAll<Pin>()
})