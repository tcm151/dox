import type { AppSettings } from "@@/shared/types"

export default defineEventHandler(async (event) => {
    const auth = await authenticateRequest(event)
    requireRole(auth, "admin")

    const { id } = event.context.params!
    const settings = await readBody<AppSettings>(event)

    return SettingsManager.update(`appSettings:${id}`, settings)
})