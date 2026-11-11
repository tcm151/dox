import { parseRecordId } from "@@/shared/utils/records"

export default defineEventHandler(async (event) => {
    const { id } = event.context.params!
    const comment = await new DatabaseQuery()
        .addSql(`
            SELECT context
            FROM $comment
        `)
        .addRecord("comment", `comment:${id}`)
        .queryOne<{ context: string }>()

    const discussion = parseRecordId(comment.context)
    if (!discussion || (discussion.table !== "post" && discussion.table !== "gallery")) {
        throw createError({
            statusCode: 404,
            statusMessage: "The discussion for this comment could not be found.",
        })
    }

    const destination = `/${discussion.table}/${encodeURIComponent(discussion.id)}#${encodeURIComponent(`comment:${id}`)}`
    return sendRedirect(event, destination, 302)
})
