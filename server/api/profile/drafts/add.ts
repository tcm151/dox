import { Draft } from "~/types";

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody(event)
    draft.user = auth.id

    var { sql, parameters } = queryBuilder()
    sql.push('CREATE draft')
    sql.push('CONTENT $draft')
    parameters['draft'] = draft
    return await queryOne<Draft>({ sql, parameters })
})