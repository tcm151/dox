import type { Gallery } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const gallery = await new DatabaseQuery()
        .addSql(`
            UPDATE $gallery SET visits += 1
        `)
        .addRecord("gallery", `gallery:${id}`)
        .queryOne<Gallery>()

    return gallery.visits
})