import type { Feedback } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)

    const { content } = await readBody<{ content: string }>(event)

    return await new DatabaseQuery()
        .addSql(`
            CREATE feedback SET
            user = $user,
            content = $content
        `)
        .addRecord('user', auth.id)
        .addParameter('content', content)
        .queryOne<Feedback>()
})