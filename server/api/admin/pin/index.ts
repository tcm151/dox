import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM pin
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .queryAll<Pin>()

    // TODO remove this and just do everything in one query
    return await attachPinModeration(pins)
})