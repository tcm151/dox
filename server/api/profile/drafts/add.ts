import type { Draft } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const draft = await readBody(event)
    draft.user = auth.id

    return await new DatabaseQuery()
        .addSql(`
            CREATE draft
            CONTENT $draft
        `)
        .addParameter('draft', draft)
        .queryOne<Draft>()
})