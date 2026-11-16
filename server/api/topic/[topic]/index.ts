import type { Topic } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    const viewer = await authenticateOptionalRequest(event)
    if (viewer && await UserSettingsManager.isBlocked(viewer.id, `topic:${topic}`)) {
        throw createError({ statusCode: 404, statusMessage: "Topic not found." })
    }

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM $topic
            FETCH moderators, galleries, galleries.user, galleries.images
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryOne<Topic>()
})