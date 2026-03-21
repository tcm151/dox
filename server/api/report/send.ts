import type { Post } from "~/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const report = await readBody<{ subject: string }>(event)

    return await new DatabaseQuery()
        .addSql(`
            CREATE report SET
            subject = $subject,
            reporter = $reporter;
        `)
        .addRecord("subject", report.subject)
        .addRecord("reporter", auth.id)
        .queryOne<Post>()
})