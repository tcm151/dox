import type { Topic } from "@@/shared/types"
import { authenticateOptionalRequest } from "@@/server/utils/auth"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const { topic } = event.context.params!
    const viewer = await authenticateOptionalRequest(event)
    if (viewer) await UserSettingsManager.isBlocked(viewer, `topic:${topic}`, 404)

    return await new DatabaseQuery()
        .addSql(`
            SELECT id, description, rules, status, posts, threads, links,
                galleries.{id, user.{id, name, roles}, title, description, tags, time, topics, comments,
                    images.{id, url}, votes, score, visits, status, moderation},
                followers, moderators.{id, name, roles}, moderation, time, visits, votes, score, firstUsed
            FROM $topic
        `)
        .addRecord("topic", `topic:${topic}`)
        .queryOne<Topic>()
})