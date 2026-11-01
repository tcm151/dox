import type { Pin } from "@@/shared/types"
import { attachPinModeration } from "@@/server/utils/pinModeration"

export default defineEventHandler(async (event) => {
    const pins = await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM pin
            WHERE active = true
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images.url;
        `)
        .queryAll<Pin>()

    return await attachPinModeration(pins)
})