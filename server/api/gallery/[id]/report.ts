import type { Report } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { id } = event.context.params!

    return await new DatabaseQuery()
        .addSql(`
            CREATE report SET
                subject = $gallery,
                reporter = $user,
                time = time::now()
        `)
        .addRecord("gallery", `gallery:${id}`)
        .addRecord("user", auth.id)
        .queryOne<Report>()
})