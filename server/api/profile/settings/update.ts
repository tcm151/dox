import type { UserSettings } from "@@/shared/types"
import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    const body = await readBody<UserSettings>(event)
    return await UserSettingsManager.update(auth.id, body)
})