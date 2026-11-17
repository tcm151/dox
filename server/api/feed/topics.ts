import { SettingsManager } from "@@/server/utils/SettingsManager"
import { TopicManager } from "@@/server/utils/TopicManager"

export default defineEventHandler(async () => {
    await SettingsManager.canViewFeed("topics")
    return await TopicManager.list()
})
