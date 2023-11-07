import type { Draft } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { draftId } = event.context.params!

    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $draft')
    parameters['draft'] = `draft:${draftId}`
    let draft = await queryOne<Draft>({ sql, parameters })

    if (draft.user === auth.id) {
        const draft = await readBody(event)

        var { sql, parameters } = queryBuilder()
        sql.push('UPDATE $draft SET')
        sql.push('title = $title,')
        sql.push('content = $content,')
        sql.push('topics = $topics,')
        sql.push('timeEdited = time::now()')
        parameters['draft'] = `draft:${draftId}`
        parameters['title'] = draft.title
        parameters['content'] = draft.content
        parameters['topics'] = draft.topics
        return await queryOne<Draft>({ sql, parameters })
    }
})