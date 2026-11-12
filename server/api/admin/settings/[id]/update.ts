import type { AppSettings } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { ModerationManager } from "@@/server/utils/ModerationManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    const settings = await readBody<AppSettings>(event)

    const updatedSettings = await SettingsManager.update(`appSettings:${id}`, settings)
    await ModerationManager.reviewApprovals(updatedSettings.moderation.threshold)
    return updatedSettings
})