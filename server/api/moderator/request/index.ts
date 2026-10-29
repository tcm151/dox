import type { User, Topic } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { ModeratorRequestManager } from "@@/server/utils/ModeratorRequestManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "moderator")

    const settings = await SettingsManager.get()
    await ModeratorRequestManager.reconcile(settings.moderation.threshold)

    return await new DatabaseQuery()
        .addSql(`
            SELECT *
            FROM moderationRequest
            FETCH topic, user
        `)
        .addRecord("user", auth.id)
        .queryAll<{ id: string, topic: Topic, user: User }[]>()
})