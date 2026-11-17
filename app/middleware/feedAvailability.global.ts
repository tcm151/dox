import { feedSettingsByRoute } from "../utils/feedSettings"

export default defineNuxtRouteMiddleware(async (to) => {
    const feedSetting = feedSettingsByRoute[to.path]
    if (!feedSetting) return

    const settings = useSettings()
    await callOnce("app.settings", () => settings.refresh())
    if (!settings.app.feeds[feedSetting]) {
        return abortNavigation(createError({ statusCode: 404, statusMessage: "Feed is not available." }))
    }
})
