import type { ModerationRequest } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    const settings = await SettingsManager.get()
    await ModerationManager.reviewApprovals(settings.moderation.threshold)

    return await new DatabaseQuery()
        .addSql(`
            LET $topics = (
                SELECT VALUE id
                FROM topic
                WHERE moderators CONTAINS $user
            );
            RETURN SELECT id, topic.{id}, user.{id, name, roles}, approvals, denials, closed
            FROM moderationRequest
            WHERE (user = $user OR topic IN $topics)
            OR $user.roles CONTAINS "admin"
        `)
        .addTransaction()
        .addRecord("user", auth.id)
        .queryValue<ModerationRequest[]>()
})