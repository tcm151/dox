import type { Feedback } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { authenticateOptionalRequest } from "@@/server/utils/auth"

export default defineEventHandler(async (event) => {
    const settings = await SettingsManager.get()
    if (!settings.misc.feedback.enabled) {
        throw createError({ statusCode: 403, statusMessage: "Feedback is disabled." })
    }

    const author = await authenticateOptionalRequest(event)
    if (!author && !settings.misc.feedback.allowAnonymous) {
        throw createError({ statusCode: 401, statusMessage: "Authentication is required to submit feedback." })
    }

    const { content } = await readBody<{ content: string }>(event)

    const query = new DatabaseQuery()
        .addSql(author
            ? `CREATE feedback SET user = $user, content = $content`
            : `CREATE feedback SET content = $content`,
        )
        .addParameter("content", content)

    if (author) {
        query.addRecord("user", author.id)
    }

    return await query.queryOne<Feedback>()
})