import { Draft } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const { draftId } = event.context.params!
    
    var { sql, parameters } = queryBuilder()
    sql.push('SELECT *')
    sql.push('FROM $draft')
    parameters['draft'] = `draft:${draftId}`
    const draft = await queryOne<Draft>({ sql, parameters })

    if (draft.user === auth.id) {
        var { sql, parameters } = queryBuilder()
        sql.push('DELETE $draft')
        parameters['draft'] = `draft:${draftId}`
        return await queryOne<Draft>({ sql, parameters })
    }

    return false
})