import type { Link } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!

    const link = await new DatabaseQuery()
        .addSql(`
            UPDATE $link SET
                visits += 1
        `)
        .addRecord("link", `link:${id}`)
        .queryOne<Link>()

    return link.visits
})
