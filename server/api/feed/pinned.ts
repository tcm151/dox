import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM pin
            FETCH user, item.user, item.replyTo, item.quote, item.quote.user, item.images;
        `)
        .queryAll<Post>()
})