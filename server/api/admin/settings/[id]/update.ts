import type { AppSettings } from "@@/shared/types"
import { SettingsManager } from "@@/server/utils/SettingsManager"
import { ModeratorRequestManager } from "@@/server/utils/ModeratorRequestManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    const settings = await readBody<AppSettings>(event)

    const updatedSettings = await SettingsManager.update(`appSettings:${id}`, settings)
    await ModeratorRequestManager.reconcile(updatedSettings.moderation.threshold)
    return updatedSettings
})