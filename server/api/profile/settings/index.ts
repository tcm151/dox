import { UserSettingsManager } from "@@/server/utils/repos/UserSettingsManager"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    return await UserSettingsManager.get(auth.id)
})